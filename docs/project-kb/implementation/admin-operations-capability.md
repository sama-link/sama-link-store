# Admin & Operations Capability Model — Sama Link Store

**Layer:** Implementation
**Derives from:** Technical Requirements · Project Definition (success criteria: team can manage catalog/orders without engineering)
**Implements constraints from:** ADR-003 (Medusa v2)
**Notion source:** https://www.notion.so/33a13205fce681628d6af8bc17d135e7

---

## Capability Principle

The Sama Link team must be able to manage catalog, orders, and customer operations without engineering involvement in daily tasks. This is a success criterion from the project definition, not a convenience feature. Admin capability scope is driven by this requirement.

---

## Admin Interface Options

| Option | Description | Tradeoffs |
|---|---|---|
| Medusa Admin (built-in) | Medusa's first-party admin UI; ships with Medusa v2 | No build cost; covers core ops; limited customization |
| Custom Admin UI | Bespoke admin interface built on Medusa Admin API | Full control; significant build and maintenance cost |

**Default at MVP:** Use Medusa Admin for all standard operational tasks. Custom admin UI is only justified if Medusa Admin cannot support a required operational workflow. This follows ADR-018 (Medusa defaults before extending).

---

## Catalog Management Capability

Operations the admin interface must support:

- Create, edit, and publish products (title, description, images, pricing, inventory, status)
- Manage product categories (create, rename, reorder, assign products)
- Manage product variants (add/remove options, set variant prices and stock levels)
- Upload and associate product images
- Apply and remove product tags
- Set product SEO fields (meta title, meta description, handle)

All catalog operations are available in Medusa Admin without customization.

---

## Order Lifecycle Management

| Order State | Admin Action | Medusa Support |
|---|---|---|
| Pending (payment captured) | Review order details, customer info, line items | Built-in |
| Processing | Mark as processing; assign to fulfillment | Built-in |
| Fulfilled | Mark fulfillment complete; add tracking number | Built-in |
| Shipped | Update shipment status; customer notification triggered | Built-in (notification via subscriber) |
| Returned / Refunded | Initiate return, process refund via Stripe | Built-in |

Order lifecycle management is fully covered by Medusa Admin at MVP scope.

---

## Inventory Management

- Stock levels are managed per variant in Medusa's Inventory Module
- Admin can view, increase, and decrease stock quantities
- Low-stock thresholds and alerts are an open dependency (Medusa Admin has basic inventory views; alert automation requires a subscriber or external tool)
- Real-time inventory sync with an external WMS is explicitly out of MVP scope (project definition)

---

## Pricing Management

- Base prices are set per variant in Medusa Admin
- Price lists (for promotions, regional pricing, or customer group pricing) are managed in Medusa Admin
- Discount codes and automatic promotions are managed via Medusa Promotions module in Admin
- Advanced promotions engine is out of MVP scope (project definition)

---

## Customer Visibility

Admin operations on customer data:

- View customer list and individual customer profiles
- View customer order history
- Manually adjust order status where Medusa Admin permits
- Password reset and account management (via Medusa Admin or direct database where Admin UI is insufficient)

Customer data access is read-heavy at MVP. Write operations are limited to order status adjustments and customer service actions available in Medusa Admin.

---

## Open Dependencies

| Open Item | Impact on This Page | Blocks |
|---|---|---|
| Medusa Admin customization scope | Determines whether any custom admin UI panels are needed for MVP operational tasks | Admin build scope |
| Notification service integration | Determines whether order state transition notifications (to customers) are triggered automatically or require manual action in admin | Customer notification workflow |
| Inventory alert automation | Determines whether low-stock alerts require a custom subscriber or external integration | Inventory ops workflow |

---

## Related Implementation Files

- [`backend-patterns.md`](backend-patterns.md) — Commerce backend architectural patterns; extension model
- [`implementation-sequencing.md`](implementation-sequencing.md) — Admin capability build phase dependencies
- [`integrations-webhooks.md`](integrations-webhooks.md) — Order notification subscriber pattern
