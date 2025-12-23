# Admin UI Wireframes

## Phase 1 owner edit modules

### Booking (toggle + link)
Fields
- booking_enabled (toggle)
- booking_url (text input, optional)

Behavior
- If booking_enabled is false, public CTAs are hidden/disabled.
- booking_url is still editable and validated (HTTPS or blank).

States
- Empty: booking_url empty -> show helper text ("Add a booking link to enable online booking").
- Error: invalid URL; save blocked with inline error.
- Success: toast/inline saved state.

### Opening hours (repeater)
Row fields
- label (optional, e.g., Summer)
- day_of_week (0-6)
- opens_at / closes_at
- is_closed (checkbox)
- order_index (implicit ordering; drag or up/down)

Behavior
- Add row, edit row, delete row.
- If is_closed is true, time fields are disabled.

States
- Empty: "No opening hours added" with Add button.
- Error: invalid day_of_week or time format; show row-level error.

### Pricing tiers (repeater)
Row fields
- label (e.g., Day Ticket)
- price (e.g., £25)
- unit (optional, e.g., per day)
- order_index (implicit ordering)

Behavior
- Add row, edit row, delete row.

States
- Empty: "No pricing tiers added" with Add button.
- Error: missing label or price.

### Rules editor
Fields
- rules_text (textarea or rich text)

Behavior
- Single save action that upserts venue_rules.

States
- Empty: placeholder copy explaining what to include.
- Error: save failure banner with retry.

## Shared UI states
- Loading: skeletons per module.
- Saving: inline spinner per module.
- Saved: inline confirmation or toast.
- Permissions: owners see modules; non-owners see read-only or access denied.
