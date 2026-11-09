"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ImageWithFallback from "./ImageWithFallback";
import {
  findMenuItems,
  isCancelIntent,
  isDoneIntent,
  isOrderIntent,
  isYesIntent,
  matchNamedOption,
  normalizeAssistantText,
} from "@/app/lib/assistantText";

const initialMessage = {
  role: "assistant",
  content: "Hi! I can find restaurants and food near you, take your order, and send an invoice. Tell me what you are looking for, or say “place an order”.",
};

const contactOptions = [
  { label: "Call us", description: "+880 1794-030592", icon: "phone", href: "tel:+8801794030592" },
  { label: "WhatsApp", description: "Chat with us on WhatsApp", icon: "whatsapp", href: "https://wa.me/8801794030592" },
  { label: "Facebook", description: "Message us on Facebook", icon: "messenger", href: "https://www.facebook.com/share/19Mi4A2SNF/", external: true },
];

function OptionIcon({ type }) {
  if (type === "phone") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 2c-3.1-1.3-5.7-3.9-7-7l2-2-2-5Z" /></svg>;
  }
  if (type === "whatsapp") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.7a8 8 0 0 1-11.8 7L4 20l1.3-4A8 8 0 1 1 20 11.7Z" /><path d="M9 8.5c.3-.5.6-.5.9-.5h.4c.2 0 .4.1.5.4l.7 1.6c.1.3.1.5-.1.7l-.5.6c-.2.2-.2.4 0 .6.5.9 1.2 1.5 2.1 2 .3.1.5.1.7-.1l.7-.8c.2-.2.4-.2.7-.1l1.5.7c.3.1.4.3.4.5 0 .3-.2 1.1-.7 1.5-.5.5-1.3.7-2 .5-1.1-.3-2.5-.9-3.9-2.2-1.2-1.1-2-2.5-2.2-3.5-.2-.7.1-1.4.5-1.9Z" /></svg>;
  }
  if (type === "messenger") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3C6.8 3 3 6.7 3 11.5c0 2.5 1.1 4.7 3 6.2V21l3.1-1.7c.9.2 1.8.4 2.9.4 5.2 0 9-3.7 9-8.5S17.2 3 12 3Z" /><path className="support-icon-cutout" d="m7.5 14.5 3.2-3.4 2.1 1.7 3.7-3.3-3.2 3.5-2.1-1.7-3.7 3.2Z" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4V5Z" /><path d="M8 9h8M8 12h5" /></svg>;
}

function stripAnswerPrefix(value, prefix) {
  return value.replace(prefix, "").trim();
}

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([initialMessage]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(false);
  const [orderDraft, setOrderDraft] = useState(null);
  const widgetRef = useRef(null);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const sessionIdRef = useRef(null);

  const addMessage = useCallback((role, content) => {
    setMessages((items) => [...items, { role, content }]);
  }, []);

  const assistantRequest = useCallback(async (payload) => {
    if (!sessionIdRef.current) {
      const storageKey = "foodflow-assistant-session";
      sessionIdRef.current = window.sessionStorage.getItem(storageKey);
      if (!sessionIdRef.current) {
        sessionIdRef.current = window.crypto?.randomUUID?.() ||
          `foodflow-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        window.sessionStorage.setItem(storageKey, sessionIdRef.current);
      }
    }
    const response = await fetch("/api/v1/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, sessionId: sessionIdRef.current, channel: "web" }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || "The assistant could not complete that request.");
    }
    return result;
  }, []);

  const sendMessage = useCallback(async (rawText) => {
    const text = rawText.trim();
    if (!text || isSending) return;
    setInput("");
    addMessage("user", text);
    setIsSending(true);

    try {
      if (orderDraft?.step === "confirmation" && isCancelIntent(text)) {
        setOrderDraft(null);
        addMessage("assistant", "No problem, I cancelled that order. You can ask me for recommendations or start a new order.");
        return;
      }

      if (!orderDraft && isOrderIntent(text)) {
        setOrderDraft({ step: "location", items: [], customer: {} });
        addMessage("assistant", "Sure, I can help place your order. Which city should I search in?");
        return;
      }

      if (orderDraft?.step === "location") {
        const result = await assistantRequest({ action: "chat", message: "hello", location: text });
        const restaurants = result.data?.restaurants || [];
        if (restaurants.length === 0) {
          addMessage("assistant", result.reply || `I couldn't find restaurants in ${text}. Please try another city.`);
          return;
        }
        setOrderDraft({ ...orderDraft, step: "restaurant", location: text, restaurants });
        addMessage("assistant", `I found these restaurants in ${text}:\n${restaurants.map((restaurant, index) => `${index + 1}. ${restaurant.name}${restaurant.address ? ` — ${restaurant.address}` : ""}`).join("\n")}\n\nWhich restaurant would you like?`);
        return;
      }

      if (orderDraft?.step === "restaurant") {
        const selectedRestaurant = matchNamedOption(text, orderDraft.restaurants);
        if (!selectedRestaurant) {
          addMessage("assistant", "I couldn't match that restaurant. Choose its name or the number from the list.");
          return;
        }
        const result = await assistantRequest({ action: "menu", restaurant_id: selectedRestaurant._id });
        const restaurant = result.data?.restaurant;
        if (!restaurant || !result.data.foods?.length) {
          addMessage("assistant", `${selectedRestaurant.name} doesn't have menu items listed right now. Please choose another restaurant.`);
          return;
        }
        setOrderDraft({ ...orderDraft, step: "food", restaurant, menu: result.data.foods, items: [] });
        addMessage("assistant", `${restaurant.name} menu:\n${result.data.foods.map((food) => `• ${food.name} — Tk ${food.price.toFixed(2)}`).join("\n")}\n\nWhat would you like, and how many? For example: “2 chicken burgers”.`);
        return;
      }

      if (orderDraft?.step === "food") {
        if (isDoneIntent(text)) {
          if (!orderDraft.items.length) {
            addMessage("assistant", "Please choose at least one item from the menu first.");
            return;
          }
          setOrderDraft({ ...orderDraft, step: "name" });
          addMessage("assistant", "Got it. What name should I put on the order?");
          return;
        }
        const menuMatches = findMenuItems(text, orderDraft.menu || []);
        if (!menuMatches.length) {
          addMessage("assistant", "Please choose an item from the menu and give a quantity from 1 to 99. Type “done” when finished.");
          return;
        }
        const topScore = menuMatches[0].score;
        const topMatches = menuMatches.filter((match) => match.score === topScore);
        if (topMatches.length > 1 && topMatches[0].start === topMatches[1].start) {
          addMessage("assistant", `I found a few similar items. Which one do you mean?\n${topMatches.map(({ food }) => `• ${food.name}`).join("\n")}`);
          return;
        }
        const selectedMatches = [];
        for (const match of menuMatches) {
          if (selectedMatches.some((selected) => match.start <= selected.end && selected.start <= match.end)) continue;
          selectedMatches.push(match);
        }
        const items = [...orderDraft.items];
        for (const { food, quantity } of selectedMatches) {
          if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
            addMessage("assistant", "Please enter a quantity from 1 to 99 for each menu item.");
            return;
          }
          const existingIndex = items.findIndex((item) => item.id === food.id);
          if (existingIndex >= 0) {
            items[existingIndex] = { ...items[existingIndex], quantity: items[existingIndex].quantity + quantity };
          } else {
            items.push({
              id: food.id,
              restaurant_id: orderDraft.restaurant._id,
              name: food.name,
              price: food.price,
              quantity,
            });
          }
        }
        if (items.some((item) => item.quantity > 99)) {
          addMessage("assistant", "The maximum quantity per menu item is 99. Please enter smaller quantities.");
          return;
        }
        setOrderDraft({ ...orderDraft, items });
        addMessage("assistant", `Added ${selectedMatches.map(({ food, quantity }) => `${food.name} x${quantity}`).join(", ")}. Anything else from this menu? Tell me the item and quantity, or type “done”.`);
        return;
      }

      if (orderDraft?.step === "name") {
        const name = stripAnswerPrefix(text, /^(?:(?:my\s+)?name\s+is|name\s*[:=]|i\s+am|i(?:['’]m|m)|you can put it under|আমার নাম)\s*/i);
        if (name.length < 2 || name.length > 120) {
          addMessage("assistant", "Please enter a name between 2 and 120 characters.");
          return;
        }
        setOrderDraft({ ...orderDraft, step: "address", customer: { ...orderDraft.customer, name } });
        addMessage("assistant", "What is the full delivery address?");
        return;
      }

      if (orderDraft?.step === "address") {
        const address = stripAnswerPrefix(text, /^(?:(?:my\s+)?address(?:\s+is)?|address\s*[:=]|i\s+live\s+at|deliver(?:y)?\s+to|delivery address is|আমার ঠিকানা)\s*/i);
        if (address.length < 5 || address.length > 300) {
          addMessage("assistant", "Please enter a complete delivery address (5–300 characters).");
          return;
        }
        setOrderDraft({ ...orderDraft, step: "phone", customer: { ...orderDraft.customer, address } });
        addMessage("assistant", "What phone number should the delivery partner call?");
        return;
      }

      if (orderDraft?.step === "phone") {
        const phone = normalizeAssistantText(text).match(/\d[\d\s()-]{5,}\d/)?.[0].replace(/\D/g, "");
        if (!phone || phone.length < 7 || phone.length > 20) {
          addMessage("assistant", "Please enter a valid phone number, including the country code if needed.");
          return;
        }
        const customer = { ...orderDraft.customer, phone };
        const result = await assistantRequest({
          action: "order",
          customer,
          items: orderDraft.items.map(({ id, restaurant_id, quantity }) => ({ id, restaurant_id, quantity })),
        });
        setOrderDraft({
          ...orderDraft,
          step: "confirmation",
          customer,
          requestId: result.requestId,
          confirmationToken: result.confirmationToken,
        });
        addMessage("assistant", result.message);
        return;
      }

      if (orderDraft?.step === "confirmation") {
        if (!isYesIntent(text)) {
          addMessage("assistant", "Please confirm with “yes”, “জি”, or “ঠিক আছে”, or reply “no” to cancel.");
          return;
        }
        const result = await assistantRequest({
          action: "order",
          customer: orderDraft.customer,
          items: orderDraft.items.map(({ id, restaurant_id, quantity }) => ({ id, restaurant_id, quantity })),
          requestId: orderDraft.requestId,
          confirmationToken: orderDraft.confirmationToken,
          confirmed: true,
        });
        setOrderDraft(null);
        addMessage("assistant", result.message);
        return;
      }

      const result = await assistantRequest({ action: "chat", message: text });
      addMessage("assistant", result.reply || "I couldn't find a recommendation for that. Try a food name or location.");
    } catch (error) {
      addMessage("assistant", error.message || "Sorry, I couldn't reach the FoodFlow assistant. Please try again.");
    } finally {
      setIsSending(false);
    }
  }, [addMessage, assistantRequest, isSending, orderDraft]);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
    else {
      window.speechSynthesis?.cancel();
      recognitionRef.current?.stop();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!voiceReplies || !isOpen) return;
    const latest = messages[messages.length - 1];
    if (latest?.role !== "assistant" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(latest.content);
    utterance.lang = /[\u0980-\u09FF]/.test(latest.content) ? "bn-BD" : "en-US";
    window.speechSynthesis.speak(utterance);
  }, [messages, voiceReplies, isOpen]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) setIsOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const startVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addMessage("assistant", "Voice input isn't supported in this browser. Please type your message instead.");
      return;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "bn-BD";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim();
      if (transcript) sendMessage(transcript);
    };
    recognition.onerror = () => addMessage("assistant", "I couldn't hear that clearly. Please try again or type your message.");
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  return (
    <div className="support-widget" ref={widgetRef}>
      {isOpen && (
        <section className="support-panel support-chat-panel" aria-label="FoodFlow AI chat">
          <div className="support-panel-header support-chat-header">
            <div className="support-chat-avatar"><OptionIcon type="chat" /></div>
            <div>
              <strong>FoodFlow AI</strong>
              <span>Restaurant picks · Orders · Invoices</span>
            </div>
            <button
              className={`support-voice-reply${voiceReplies ? " is-active" : ""}`}
              type="button"
              aria-label={voiceReplies ? "Turn off spoken replies" : "Turn on spoken replies"}
              aria-pressed={voiceReplies}
              onClick={() => setVoiceReplies((enabled) => !enabled)}
              title="Spoken replies"
            >
              <span aria-hidden="true">🔊</span>
            </button>
            <button
              className="support-close"
              type="button"
              aria-label="Close chat"
              onClick={() => setIsOpen(false)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <div className="support-chat-messages" ref={messagesRef} aria-live="polite">
            {messages.map((message, index) => (
              <div className={`support-chat-message is-${message.role}`} key={`${index}-${message.content.slice(0, 20)}`}>
                {message.content}
              </div>
            ))}
            {isSending && <div className="support-chat-typing" role="status">FoodFlow AI is thinking…</div>}
          </div>
          <form
            className="support-chat-form"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage(input);
            }}
          >
            <button
              className={`support-mic-button${isListening ? " is-listening" : ""}`}
              type="button"
              aria-label={isListening ? "Stop voice input" : "Speak your message"}
              title={isListening ? "Stop listening" : "Speak your message"}
              onClick={startVoiceInput}
            >
              {isListening ? "■" : "🎙"}
            </button>
            <input
              ref={inputRef}
              value={input}
              maxLength={500}
              placeholder={isListening ? "Listening…" : "Type or speak a message"}
              aria-label="Message FoodFlow AI"
              onChange={(event) => setInput(event.target.value)}
              disabled={isSending}
            />
            <button className="support-send-button" type="submit" disabled={!input.trim() || isSending} aria-label="Send message">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 4 17 8-17 8 3-8-3-8Zm3 8h14" /></svg>
            </button>
          </form>
          <div className="support-chat-contacts">
            <span>Need help?</span>
            {contactOptions.map((option) => (
              <a
                href={option.href}
                key={option.label}
                target={option.external ? "_blank" : undefined}
                rel={option.external ? "noopener noreferrer" : undefined}
                aria-label={option.label}
                title={option.description}
              >
                <OptionIcon type={option.icon} />
              </a>
            ))}
          </div>
        </section>
      )}
      <button
        className={`support-launcher${isOpen ? " is-open" : ""}`}
        type="button"
        aria-label={isOpen ? "Close FoodFlow AI chat" : "Chat with FoodFlow AI"}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <ImageWithFallback src="/support.jpg" alt="" />
        <span className="support-online-indicator" aria-label="Available now" />
      </button>
    </div>
  );
}
