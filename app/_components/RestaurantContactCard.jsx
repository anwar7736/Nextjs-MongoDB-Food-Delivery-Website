const ContactIcon = ({ type }) => {
  const paths = {
    location: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    phone: <path d="M7 3h3l2 5-2 1.5a15 15 0 0 0 4.5 4.5L16 12l5 2v3c0 1.1-.9 2-2 2C10 19 5 14 4 5c0-1.1.9-2 2-2Z" />,
    email: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
    restaurant: <><path d="M4 21h16M6 21V8h12v13M4 8h16l-2-5H6L4 8Z" /><path d="M9 12h2m2 0h2m-6 4h2m2 0h2" /></>,
  };

  return (
    <span className="food-detail-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {paths[type]}
      </svg>
    </span>
  );
};

export default function RestaurantContactCard({ restaurant }) {
  return (
    <section className="food-detail-restaurant" aria-labelledby="restaurant-contact-heading">
      <div className="food-detail-restaurant-heading">
        <ContactIcon type="restaurant" />
        <div>
          <p className="food-detail-eyebrow">Visit or contact</p>
          <h2 id="restaurant-contact-heading">{restaurant?.name || "Restaurant"}</h2>
        </div>
      </div>
      <div className="food-detail-restaurant-grid">
        <div className="food-detail-contact">
          <ContactIcon type="location" />
          <div><strong>Address</strong><span>{restaurant?.address || "Address not available"}</span></div>
        </div>
        <div className="food-detail-contact">
          <ContactIcon type="location" />
          <div><strong>City</strong><span>{restaurant?.city || "City not available"}</span></div>
        </div>
        <div className="food-detail-contact">
          <ContactIcon type="phone" />
          <div><strong>Call us</strong><span>{restaurant?.phone || "Phone not available"}</span></div>
        </div>
        <div className="food-detail-contact">
          <ContactIcon type="email" />
          <div><strong>Email</strong><span>{restaurant?.email || "Email not available"}</span></div>
        </div>
      </div>
    </section>
  );
}
