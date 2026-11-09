import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { mongoDB_connect } from "@/app/helpers/helper";
import { getDatabaseErrorDetails } from "@/app/lib/db";
import { deliverySchema } from "@/app/models/deliveryModel";
import { foodSchema } from "@/app/models/foodModel";
import { orderItemSchema } from "@/app/models/orderItemModel";
import { orderSchema } from "@/app/models/orderModel";
import { orderStatusLogSchema } from "@/app/models/orderStatusLogModel";
import { assistantOrderRequestSchema } from "@/app/models/assistantOrderRequestModel";
import { DEFAULT_ORDER_STATUS_ID, orderStatusSchema } from "@/app/models/orderStatusModel";
import { restaurantSchema } from "@/app/models/restaurantModel";
import { userSchema } from "@/app/models/userModel";
import { ORDER_STATUS_SEEDS } from "@/app/lib/orderStatus";
import { getAssistantQueryTokens, normalizeAssistantText, scoreFoodMatch } from "@/app/lib/assistantText";

const SHIPPING_CHARGE = 50;
const MAX_ORDER_ITEMS = 20;
function jsonResponse(success, message, status = 200, extra = {}) {
  return NextResponse.json({ success, message, ...extra }, { status });
}

function hasValidApiKey(request) {
  const expected = process.env.N8N_API_KEY;
  const authorization = request.headers.get("authorization") || "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!expected || !supplied) return false;

  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export async function recommend(message, requestedLocation) {
  const normalizedMessage = normalizeAssistantText(message);
  const cities = (await restaurantSchema.distinct("city"))
    .filter((city) => typeof city === "string" && city.trim());
  const requestedLocationText = normalizeAssistantText(requestedLocation);
  const matchedCity = requestedLocationText
    ? cities.find((city) => {
      const normalizedCity = normalizeAssistantText(city);
      return requestedLocationText === normalizedCity || requestedLocationText.includes(normalizedCity);
    }) || requestedLocation.trim()
    : cities.find((city) => {
      const cityTokens = normalizeAssistantText(city).split(" ");
      const messageTokens = new Set(normalizedMessage.split(" "));
      return cityTokens.every((token) => messageTokens.has(token));
    });
  const cityTokens = matchedCity ? normalizeAssistantText(matchedCity).split(" ") : [];
  const queryTokens = getAssistantQueryTokens(normalizedMessage, cityTokens);
  const hasFoodQuery = queryTokens.length > 0;
  const foodQuery = queryTokens.join(" ");

  if (!hasFoodQuery) {
    if (!matchedCity) {
      return {
        success: true,
        reply: "Hello! I can recommend restaurants and dishes near you. Which city or area should I search?",
        data: { locations: cities },
      };
    }

    const restaurants = await restaurantSchema.find({
      city: { $regex: `^${escapeRegex(matchedCity)}$`, $options: "i" },
    }).select("_id name city address");
    if (restaurants.length === 0) {
      return { success: true, reply: `I couldn't find restaurants in ${matchedCity}. Please try another city.` };
    }

    const foods = await foodSchema.find({
      restaurant_id: { $in: restaurants.map((restaurant) => restaurant._id) },
    }).select("name price restaurant_id").limit(100);
    const suggestions = restaurants.map((restaurant) => ({
      _id: String(restaurant._id),
      name: restaurant.name,
      location: restaurant.city,
      address: restaurant.address,
      foods: foods.filter((food) => String(food.restaurant_id) === String(restaurant._id))
        .slice(0, 5)
        .map((food) => ({
          id: String(food._id),
          name: food.name,
          price: Number(food.price),
        })),
    }));
    const lines = suggestions.map((restaurant) =>
      `${restaurant.name} (${restaurant.location}${restaurant.address ? `, ${restaurant.address}` : ""})` +
      (restaurant.foods.length
        ? `\n  ${restaurant.foods.map((food) => `${food.name} — Tk ${food.price.toFixed(2)}`).join("\n  ")}`
        : "\n  Menu not available yet.")
    );
    return {
      success: true,
      reply: `Here are some FoodFlow picks in ${matchedCity}:\n${lines.join("\n")}`,
      data: { restaurants: suggestions },
    };
  }

  const allFoods = await foodSchema.find({}).select("name price restaurant_id").limit(2000);
  const matches = allFoods.map((food) => ({
    food,
    score: scoreFoodMatch(queryTokens, food.name),
  })).filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ food }) => food);
  if (matches.length === 0) {
    const restaurants = await restaurantSchema.find({})
      .select("_id name city address")
      .limit(1000);
    const restaurantMatches = restaurants.map((restaurant) => ({
      restaurant,
      score: scoreFoodMatch(queryTokens, restaurant.name),
    })).filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    const matchingRestaurants = restaurantMatches.filter(({ restaurant }) =>
      !matchedCity || normalizeAssistantText(restaurant.city) === normalizeAssistantText(matchedCity)
    );
    if (matchingRestaurants.length) {
      const restaurantIds = matchingRestaurants.map(({ restaurant }) => restaurant._id);
      const foods = await foodSchema.find({ restaurant_id: { $in: restaurantIds } })
        .select("name price restaurant_id")
        .limit(100);
      const suggestions = matchingRestaurants.map(({ restaurant }) => ({
        _id: String(restaurant._id),
        name: restaurant.name,
        location: restaurant.city,
        address: restaurant.address,
        foods: foods.filter((food) => String(food.restaurant_id) === String(restaurant._id))
          .slice(0, 5)
          .map((food) => ({ id: String(food._id), name: food.name, price: Number(food.price) })),
      }));
      const lines = suggestions.map((restaurant) =>
        `${restaurant.name} (${restaurant.location}${restaurant.address ? `, ${restaurant.address}` : ""})` +
        (restaurant.foods.length
          ? `\n  ${restaurant.foods.map((food) => `${food.name} — Tk ${food.price.toFixed(2)}`).join("\n  ")}`
          : "\n  Menu not available yet.")
      );
      return {
        success: true,
        reply: `Here are the restaurants I found:\n${lines.join("\n")}`,
        data: { restaurants: suggestions },
      };
    }
    return {
      success: true,
      reply: `Sorry, I couldn't find “${foodQuery}” on the available menus. Try another food name or location.`,
      data: { matches: [] },
    };
  }

  const restaurantIds = [...new Set(matches.map((food) => String(food.restaurant_id)))];
  const restaurants = await restaurantSchema.find({ _id: { $in: restaurantIds } }).select("name city address");
  const restaurantById = new Map(restaurants.map((restaurant) => [String(restaurant._id), restaurant]));
  const available = matches.flatMap((food) => {
    const restaurant = restaurantById.get(String(food.restaurant_id));
    if (!restaurant || (matchedCity && normalizeAssistantText(restaurant.city) !== normalizeAssistantText(matchedCity))) return [];
    return [{
      id: String(food._id),
      restaurant_id: String(restaurant._id),
      food: food.name,
      price: Number(food.price),
      restaurant: restaurant.name,
      location: restaurant.city,
      address: restaurant.address,
    }];
  });

  if (available.length === 0 && matchedCity) {
    const otherLocations = matches.map((food) => {
      const restaurant = restaurantById.get(String(food.restaurant_id));
      return restaurant ? `${restaurant.name} (${restaurant.city})` : null;
    }).filter(Boolean);
    if (otherLocations.length === 0) {
      return { success: true, reply: `Sorry, I couldn't find “${foodQuery}” on the available menus.` };
    }
    return {
      success: true,
      reply: `I couldn't find “${foodQuery}” in ${matchedCity}. It is listed at ${[...new Set(otherLocations)].join(", ")}.`,
      data: { matches: [], available_elsewhere: otherLocations },
    };
  }

  if (available.length === 0) {
    return { success: true, reply: `Sorry, I couldn't find “${foodQuery}” on the available menus.` };
  }

  const details = available.slice(0, 10).map((item) =>
    `${item.food} — Tk ${item.price.toFixed(2)} at ${item.restaurant} (${item.location}${item.address ? `, ${item.address}` : ""})`
  );
  return {
    success: true,
    reply: `I found these options:\n${details.join("\n")}${matchedCity ? "" : "\nTell me your city to narrow the results."}`,
    data: { matches: available.slice(0, 10) },
  };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function orderSigningSecret() {
  const secret = process.env.N8N_API_KEY || process.env.TOTP_ENCRYPTION_KEY;
  if (!secret || secret.length < 32) {
    throw new Error("Configure a server-side signing key of at least 32 characters.");
  }
  return secret;
}

function createConfirmationToken(confirmationData, expiresAt) {
  const encoded = Buffer.from(JSON.stringify({ ...confirmationData, expiresAt })).toString("base64url");
  const signature = createHmac("sha256", orderSigningSecret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

function isValidConfirmationToken(token, confirmationData) {
  if (typeof token !== "string") return false;
  const [encoded, suppliedSignature, extra] = token.split(".");
  if (!encoded || !suppliedSignature || extra) return false;

  let tokenPayload;
  try {
    tokenPayload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return false;
  }
  if (!Number.isFinite(tokenPayload.expiresAt) || tokenPayload.expiresAt <= Date.now()) return false;
  const expectedPayload = Buffer.from(JSON.stringify({
    ...confirmationData,
    expiresAt: tokenPayload.expiresAt,
  })).toString("base64url");
  if (encoded !== expectedPayload) return false;

  const expectedSignature = Buffer.from(
    createHmac("sha256", orderSigningSecret()).update(encoded).digest("base64url")
  );
  const suppliedBuffer = Buffer.from(suppliedSignature);
  return expectedSignature.length === suppliedBuffer.length &&
    timingSafeEqual(expectedSignature, suppliedBuffer);
}

export async function placeOrder(payload) {
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const phone = typeof payload.phone === "string" ? payload.phone.trim() : "";
  const isGuestOrder = payload.customer && typeof payload.customer === "object" &&
    !Array.isArray(payload.customer);
  const guestDetails = isGuestOrder ? {
    name: typeof payload.customer.name === "string" ? payload.customer.name.trim() : "",
    phone: typeof payload.customer.phone === "string" ? payload.customer.phone.trim() : "",
    address: typeof payload.customer.address === "string" ? payload.customer.address.trim() : "",
  } : null;
  if (isGuestOrder && (
    guestDetails.name.length < 2 || guestDetails.name.length > 120 ||
    guestDetails.address.length < 5 || guestDetails.address.length > 300 ||
    !/^[+]?[\d\s()-]{7,20}$/.test(guestDetails.phone) ||
    guestDetails.phone.replace(/\D/g, "").length < 7
  )) {
    return jsonResponse(false, "Enter a valid name, delivery address, and phone number.", 400);
  }
  if (!isGuestOrder && !email && !phone) {
    return jsonResponse(false, "Provide the customer's registered email or phone number.", 400);
  }
  if (!Array.isArray(payload.items) || payload.items.length === 0 || payload.items.length > MAX_ORDER_ITEMS) {
    return jsonResponse(false, `Choose between 1 and ${MAX_ORDER_ITEMS} menu items.`, 400);
  }
  if (payload.requestId != null &&
      (typeof payload.requestId !== "string" || payload.requestId.length < 8 || payload.requestId.length > 120)) {
    return jsonResponse(false, "Invalid order request ID.", 400);
  }

  let customer = null;
  if (!isGuestOrder) {
    const customerQuery = [];
    if (email) customerQuery.push({ email });
    if (phone) customerQuery.push({ phone });
    customer = await userSchema.findOne(
      email && phone ? { email, phone } : { $or: customerQuery }
    );
    if (!customer) {
      return jsonResponse(false, "Customer account not found. Register in FoodFlow before ordering.", 404);
    }
  }
  const deliveryAddress = guestDetails?.address || customer?.address;
  if (typeof deliveryAddress !== "string" || !deliveryAddress.trim()) {
    return jsonResponse(false, "Add a delivery address to your FoodFlow account before ordering.", 400);
  }

  const itemIds = new Set();
  for (const item of payload.items) {
    if (!mongoose.isValidObjectId(item?.id) ||
        !Number.isInteger(Number(item.quantity)) || Number(item.quantity) < 1 || Number(item.quantity) > 99 ||
        itemIds.has(String(item.id))) {
      return jsonResponse(false, "Invalid order items. Use unique menu item IDs and quantities from 1 to 99.", 400);
    }
    itemIds.add(String(item.id));
  }

  const foods = await foodSchema.find({ _id: { $in: [...itemIds] } });
  if (foods.length !== payload.items.length) {
    return jsonResponse(false, "One or more menu items could not be found.", 404);
  }
  if (foods.some((food) => !Number.isFinite(Number(food.price)) || Number(food.price) < 0)) {
    return jsonResponse(false, "One or more menu items have an invalid price.", 400);
  }
  const foodById = new Map(foods.map((food) => [String(food._id), food]));
  const groups = new Map();
  for (const item of payload.items) {
    const food = foodById.get(String(item.id));
    const restaurantId = String(food.restaurant_id);
    if (item.restaurant_id && String(item.restaurant_id) !== restaurantId) {
      return jsonResponse(false, "A menu item does not belong to its selected restaurant.", 400);
    }
    if (!groups.has(restaurantId)) groups.set(restaurantId, []);
    groups.get(restaurantId).push(item);
  }

  const restaurantIds = [...groups.keys()];
  const restaurants = await restaurantSchema.find({ _id: { $in: restaurantIds } });
  if (restaurants.length !== groups.size) {
    return jsonResponse(false, "One or more restaurants could not be found.", 404);
  }
  const restaurantById = new Map(restaurants.map((restaurant) => [String(restaurant._id), restaurant]));
  const preparedOrders = [];

  for (const [restaurantId, items] of groups) {
    const restaurant = restaurantById.get(restaurantId);
    const deliveryPartners = await deliverySchema.find({ city: restaurant.city }).select("_id");
    const orderItems = items.map((item) => {
      const food = foodById.get(String(item.id));
      const quantity = Number(item.quantity);
      return {
        food_id: food._id,
        quantity,
        price: Number(food.price),
        total: Number(food.price) * quantity,
      };
    });
    const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
    preparedOrders.push({
      restaurant,
      deliveryPartnerId: deliveryPartners.length
        ? deliveryPartners[randomInt(deliveryPartners.length)]._id
        : null,
      orderItems,
      subtotal,
      shippingCharge: SHIPPING_CHARGE,
    });
  }

  let status = await orderStatusSchema.findById(DEFAULT_ORDER_STATUS_ID);
  if (!status) {
    status = await orderStatusSchema.findOneAndUpdate(
      { _id: DEFAULT_ORDER_STATUS_ID },
      { $setOnInsert: ORDER_STATUS_SEEDS[0] },
      { new: true, upsert: true }
    );
  }
  if (!status) throw new Error("Default order status is unavailable.");

  const checkoutId = payload.requestId || randomUUID();
  const existingOrders = customer
    ? await orderSchema.find({ checkout_id: checkoutId, user_id: customer._id })
    : [];
  if (existingOrders.length) {
    return jsonResponse(false, "This order request was already processed. Check your FoodFlow order history.", 409, {
      checkout_id: checkoutId,
    });
  }

  const checkoutTotal = preparedOrders.reduce(
    (sum, order) => sum + order.subtotal + order.shippingCharge,
    0
  );
  const confirmationData = {
    requestId: checkoutId,
    customerId: customer ? String(customer._id) : null,
    guest: guestDetails,
    items: preparedOrders.flatMap((order) => order.orderItems.map((item) => ({
      id: String(item.food_id),
      quantity: item.quantity,
      price: item.price,
    }))).sort((a, b) => a.id.localeCompare(b.id)),
    shippingCharge: SHIPPING_CHARGE,
  };
  const alreadyPlaced = await orderSchema.exists({ checkout_id: checkoutId });
  if (alreadyPlaced) {
    return jsonResponse(false, "This order request was already processed. Check your FoodFlow order history.", 409, {
      checkout_id: checkoutId,
    });
  }
  if (payload.confirmed !== true) {
    const expiresAt = Date.now() + 10 * 60 * 1000;
    const preview = preparedOrders.map((order) => ({
      restaurant: order.restaurant.name,
      location: order.restaurant.city,
      items: order.orderItems.map((item) => {
        const food = foodById.get(String(item.food_id));
        return { name: food.name, quantity: item.quantity, price: item.price, total: item.total };
      }),
      subtotal: order.subtotal,
      shipping_charge: order.shippingCharge,
      total: order.subtotal + order.shippingCharge,
    }));
    const summary = preview.map((invoice) =>
      `${invoice.restaurant} (${invoice.location}): ` +
      `${invoice.items.map((item) => `${item.name} x${item.quantity} — Tk ${item.total.toFixed(2)}`).join(", ")}. ` +
      `Subtotal Tk ${invoice.subtotal.toFixed(2)} + delivery Tk ${invoice.shipping_charge.toFixed(2)} = Tk ${invoice.total.toFixed(2)}`
    ).join("\n");
    return jsonResponse(true, `Please review your order:\nDeliver to: ${deliveryAddress}\nContact phone: ${guestDetails?.phone || customer.phone}\n${summary}\nTotal: Tk ${checkoutTotal.toFixed(2)}\nReply to confirm this order.`, 200, {
      requiresConfirmation: true,
      requestId: checkoutId,
      confirmationToken: createConfirmationToken(confirmationData, expiresAt),
      expiresAt: new Date(expiresAt).toISOString(),
      customer: { name: guestDetails?.name || customer.name, address: deliveryAddress },
      invoices: preview,
      total: checkoutTotal,
    });
  }
  if (!isValidConfirmationToken(payload.confirmationToken, confirmationData)) {
    return jsonResponse(false, "Order confirmation is missing, invalid, or expired. Request a fresh quote before ordering.", 400);
  }

  let orderRequest;
  try {
    orderRequest = await new assistantOrderRequestSchema({
      checkout_id: checkoutId,
      expires_at: new Date(Date.now() + 30 * 60 * 1000),
    }).save();
  } catch (error) {
    if (error.code === 11000) {
      return jsonResponse(false, "This order request was already processed. Check your FoodFlow order history.", 409, {
        checkout_id: checkoutId,
      });
    }
    throw error;
  }

  const mongoSession = await mongoose.startSession();
  const invoices = [];
  let invoiceCustomer = customer;
  try {
    await mongoSession.withTransaction(async () => {
      invoices.length = 0;
      const customerForOrder = customer || await new userSchema({
        name: guestDetails.name,
        phone: guestDetails.phone,
        address: guestDetails.address,
        password: await bcrypt.hash(randomUUID(), 10),
      }).save({ session: mongoSession });
      invoiceCustomer = customerForOrder;
      for (const prepared of preparedOrders) {
        const order = await new orderSchema({
          user_id: customerForOrder._id,
          restaurant_id: prepared.restaurant._id,
          delivery_partner_id: prepared.deliveryPartnerId,
          date: new Date(),
          invoice_no: `INV-${randomInt(100000, 1_000_000)}`,
          checkout_id: checkoutId,
          checkout_total: checkoutTotal,
          checkout_order_count: preparedOrders.length,
          total: prepared.subtotal,
          shipping_charge: prepared.shippingCharge,
          final_total: prepared.subtotal + prepared.shippingCharge,
          status_id: status._id,
        }).save({ session: mongoSession });

        await orderItemSchema.insertMany(
          prepared.orderItems.map((item) => ({ ...item, order_id: order._id })),
          { session: mongoSession }
        );
        await new orderStatusLogSchema({
          order_id: order._id,
          status_id: status._id,
          date: new Date(),
        }).save({ session: mongoSession });
        invoices.push({
          invoice_no: order.invoice_no,
          restaurant: prepared.restaurant.name,
          location: prepared.restaurant.city,
          items: prepared.orderItems.map((item) => {
            const food = foodById.get(String(item.food_id));
            return { name: food.name, quantity: item.quantity, price: item.price, total: item.total };
          }),
          subtotal: prepared.subtotal,
          shipping_charge: prepared.shippingCharge,
          total: prepared.subtotal + prepared.shippingCharge,
        });
      }
    });
  } catch (error) {
    await assistantOrderRequestSchema.deleteOne({ _id: orderRequest._id });
    throw error;
  } finally {
    await mongoSession.endSession();
  }

  const invoiceText = invoices.map((invoice) =>
    `Invoice #${invoice.invoice_no} — ${invoice.restaurant} (${invoice.location})\n` +
    `${invoice.items.map((item) => `${item.name} x${item.quantity}: Tk ${item.total.toFixed(2)}`).join("\n")}\n` +
    `Subtotal: Tk ${invoice.subtotal.toFixed(2)} | Delivery: Tk ${invoice.shipping_charge.toFixed(2)} | Total: Tk ${invoice.total.toFixed(2)}`
  ).join("\n\n");
  return jsonResponse(true, `Thank you, ${invoiceCustomer.name || "valued customer"}! Your order is confirmed.\nDeliver to: ${guestDetails?.address || invoiceCustomer.address}\nPhone: ${guestDetails?.phone || invoiceCustomer.phone}\n\n${invoiceText}\n\nWe appreciate your order and hope you enjoy your meal!`, 200, {
    checkout_id: checkoutId,
    customer: { name: invoiceCustomer.name, phone: guestDetails?.phone || invoiceCustomer.phone },
    invoices,
    total: checkoutTotal,
  });
}

export async function handleAssistantRequest(request, {
  requireN8nApiKey = false,
  useN8nWebhook = true,
} = {}) {
  if (requireN8nApiKey && !process.env.N8N_API_KEY) {
    return jsonResponse(false, "The n8n integration is not configured.", 503);
  }
  if (requireN8nApiKey && !hasValidApiKey(request)) {
    return jsonResponse(false, "Unauthorized.", 401);
  }

  try {
    const payload = await request.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return jsonResponse(false, "Invalid request body.", 400);
    }

    if (!requireN8nApiKey && useN8nWebhook && process.env.N8N_WEBHOOK_URL) {
      const webhookAuthToken = process.env.N8N_API_KEY;
      if (!webhookAuthToken || webhookAuthToken.length < 32) {
        return jsonResponse(false, "Configure N8N_API_KEY with at least 32 characters to call the protected n8n webhook.", 503);
      }

      const webhookUrl = new URL(process.env.N8N_WEBHOOK_URL);
      if (!["https:", "http:"].includes(webhookUrl.protocol)) {
        return jsonResponse(false, "The n8n webhook URL must use HTTP or HTTPS.", 500);
      }
      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${webhookAuthToken}`,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      });
      let webhookResult;
      try {
        webhookResult = await webhookResponse.json();
      } catch {
        throw new Error(`The n8n webhook returned invalid JSON (${webhookResponse.status}).`);
      }
      return NextResponse.json(webhookResult, { status: webhookResponse.status });
    }

    await mongoDB_connect();
    if (payload.action === "order") {
      return await placeOrder(payload);
    }
    if (payload.action === "menu") {
      if (!mongoose.isValidObjectId(payload.restaurant_id)) {
        return jsonResponse(false, "Choose a valid restaurant.", 400);
      }
      const restaurant = await restaurantSchema.findById(payload.restaurant_id)
        .select("_id name city address");
      if (!restaurant) return jsonResponse(false, "Restaurant not found.", 404);
      const foods = await foodSchema.find({ restaurant_id: restaurant._id })
        .select("_id name price")
        .limit(100);
      return NextResponse.json({
        success: true,
        data: {
          restaurant: {
            _id: String(restaurant._id),
            name: restaurant.name,
            location: restaurant.city,
            address: restaurant.address,
          },
          foods: foods.map((food) => ({
            id: String(food._id),
            name: food.name,
            price: Number(food.price),
          })),
        },
      });
    }
    if (payload.action && payload.action !== "chat") {
      return jsonResponse(false, "Unsupported action. Use chat, menu, or order.", 400);
    }

    const message = typeof payload.message === "string" ? payload.message.trim() : "";
    const location = typeof payload.location === "string" ? payload.location.trim() : "";
    if (message.length > 500 || location.length > 100) {
      return jsonResponse(false, "Message or location is too long.", 400);
    }
    const result = await recommend(message, location);
    return NextResponse.json(result);
  } catch (error) {
    console.error("FoodFlow assistant request failed:", error.message);
    const { message, status } = getDatabaseErrorDetails(error);
    return jsonResponse(false, message, status);
  }
}

export async function POST(request) {
  return handleAssistantRequest(request, { requireN8nApiKey: true });
}
