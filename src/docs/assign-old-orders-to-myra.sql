-- Migration script to assign all old unassigned customer orders to MYRA
-- This handles historical records before the employee assignment feature was added

-- Step 1: Find MYRA's employee ID
-- Note: Adjust the name matching if MYRA's name is stored differently
-- This query will show you MYRA's ID first
SELECT id, first_name, last_name, role 
FROM profiles 
WHERE role = 'employee' 
  AND (UPPER(first_name) LIKE '%MYRA%' OR UPPER(last_name) LIKE '%MYRA%' OR UPPER(first_name) LIKE '%GAMMAL%')
ORDER BY created_at ASC
LIMIT 1;

-- Step 2: Update all unassigned customer orders to be assigned to MYRA
-- Replace 'MYRA_EMPLOYEE_ID_HERE' with the actual ID from Step 1
-- Or use a subquery to find MYRA automatically

UPDATE orders
SET assigned_employee_id = (
  SELECT id 
  FROM profiles 
  WHERE role = 'employee' 
    AND (UPPER(first_name) LIKE '%MYRA%' OR UPPER(last_name) LIKE '%MYRA%' OR UPPER(first_name) LIKE '%GAMMAL%')
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE assigned_employee_id IS NULL
  AND (order_type IS NULL OR order_type = 'customer')
  AND EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE role = 'employee' 
      AND (UPPER(first_name) LIKE '%MYRA%' OR UPPER(last_name) LIKE '%MYRA%' OR UPPER(first_name) LIKE '%GAMMAL%')
    LIMIT 1
  );

-- Verify the update
SELECT 
  COUNT(*) as total_updated,
  SUM(loads) as total_loads_assigned
FROM orders
WHERE assigned_employee_id IS NOT NULL
  AND (order_type IS NULL OR order_type = 'customer');

