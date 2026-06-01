INSERT INTO subscription_plans
(name, description, duration_months, price, discount_percentage, is_active)
VALUES

(
  'Weekly Pass',
  'Unlimited gaming access for 7 days',
  7,
  299.00,
  10,
  true
),

(
  'Monthly Pass',
  'Unlimited access for 30 days',
  30,
  999.00,
  20,
  true
),

(
  'Weekend Pass',
  'Valid only on Friday, Saturday and Sunday',
  30,
  699.00,
  15,
  true
),

(
  'Student Pass',
  'Discounted monthly plan for students',
  30,
  799.00,
  25,
  true
),

(
  'Night Owl Pass',
  'Late-night gaming access after 8 PM',
  30,
  599.00,
  20,
  true
),

(
  'Quarterly Pro Pass',
  'Unlimited access for 90 days',
  90,
  2499.00,
  30,
  true
);