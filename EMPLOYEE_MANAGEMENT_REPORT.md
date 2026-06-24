# EMPLOYEE MANAGEMENT MODULE REPORT

**Status**: ✅ COMPLETE (Database Schema + Backend Services)

## Overview
Comprehensive employee management system including attendance, shifts, leave management, salary processing, and performance reviews.

## Components Created

### 1. Database Schema
**File**: [database/schema/006_create_employees_schema.sql](database/schema/006_create_employees_schema.sql)

Tables:
- **employees** - Core employee information
- **attendance** - Daily check-in/check-out records
- **shifts** - Shift definitions (morning, evening, night)
- **employee_shifts** - Shift assignments to employees
- **leave_requests** - Leave request tracking
- **salary** - Monthly salary records with bonus/deductions
- **performance_reviews** - Employee performance evaluations
- **disciplinary_actions** - Warnings, suspensions, terminations

### 2. Backend Service Layer
**File**: [backend/src/modules/employees/employees.service.ts](backend/src/modules/employees/employees.service.ts)

**Methods:**

#### Employee Management
- `createEmployee()` - Add new employee
- `getEmployeesByRestaurant()` - List all employees with filters
- `getEmployeeById()` - Get single employee
- `updateEmployee()` - Update employee info
- `deleteEmployee()` - Soft delete (mark as TERMINATED)

#### Attendance Management
- `markAttendance()` - Check-in employee
- `checkOutAttendance()` - Check-out employee
- `getAttendanceReport()` - Generate attendance reports by date/employee

#### Shift Management
- `createShift()` - Define shifts (e.g., "Morning: 8am-4pm")
- `getShiftsByRestaurant()` - List all shifts
- `assignShift()` - Assign shift to employee

#### Leave Management
- `requestLeave()` - Employee requests leave
- `approveLeave()` - Manager approves leave request
- `getLeaveRequests()` - List pending/approved leaves

#### Salary Management
- `createSalaryRecord()` - Create monthly salary
- `finalizeSalary()` - Lock salary for processing
- `getSalaryRecords()` - Query salary history

#### Performance Reviews
- `createPerformanceReview()` - Manager creates review
- `getPerformanceReviews()` - Retrieve reviews for employee

### 3. API Routes
**File**: [backend/src/modules/employees/employees.controller.ts](backend/src/modules/employees/employees.controller.ts)

#### Employee Endpoints
```
POST   /api/restaurants/:restaurantId/employees
GET    /api/restaurants/:restaurantId/employees
GET    /api/restaurants/:restaurantId/employees/:employeeId
PUT    /api/restaurants/:restaurantId/employees/:employeeId
DELETE /api/restaurants/:restaurantId/employees/:employeeId
```

#### Attendance Endpoints
```
POST   /api/restaurants/:restaurantId/attendance
POST   /api/restaurants/:restaurantId/attendance/checkout/:employeeId
GET    /api/restaurants/:restaurantId/attendance?startDate=2024-01-01&endDate=2024-01-31
```

#### Shift Endpoints
```
POST   /api/restaurants/:restaurantId/shifts
GET    /api/restaurants/:restaurantId/shifts
POST   /api/restaurants/:restaurantId/shifts/assign
```

#### Leave Endpoints
```
POST   /api/restaurants/:restaurantId/leave/request
POST   /api/restaurants/:restaurantId/leave/:leaveId/approve
GET    /api/restaurants/:restaurantId/leave?status=PENDING
```

#### Salary Endpoints
```
POST   /api/restaurants/:restaurantId/salary
POST   /api/restaurants/:restaurantId/salary/:salaryId/finalize
GET    /api/restaurants/:restaurantId/salary?employeeId=xxx&month=2024-01
```

#### Performance Review Endpoints
```
POST   /api/restaurants/:restaurantId/performance-review
GET    /api/restaurants/:restaurantId/performance-review?employeeId=xxx
```

## Data Models

### Employee
```typescript
{
  id: UUID
  restaurant_id: UUID
  user_id: UUID (optional)
  name: string
  email: string (optional)
  phone: string (optional)
  role: WAITER | KITCHEN_STAFF | CASHIER | MANAGER
  position: string (optional)
  hire_date: DATE
  status: ACTIVE | INACTIVE | TERMINATED | ON_LEAVE
  salary: decimal
  salary_frequency: DAILY | WEEKLY | MONTHLY
  documents: JSON (file paths)
  notes: text
}
```

### Attendance
```typescript
{
  id: UUID
  employee_id: UUID
  attendance_date: DATE
  check_in_time: TIMESTAMP
  check_out_time: TIMESTAMP (optional)
  duration_hours: decimal
  status: PRESENT | ABSENT | LATE | HALF_DAY
}
```

### Shift
```typescript
{
  id: UUID
  name: string (e.g., "Morning", "Evening", "Night")
  start_time: TIME (08:00:00)
  end_time: TIME (16:00:00)
  break_duration_minutes: integer
}
```

### Leave Request
```typescript
{
  id: UUID
  employee_id: UUID
  leave_type: SICK | CASUAL | EARNED | UNPAID | MATERNITY
  start_date: DATE
  end_date: DATE
  duration_days: integer
  reason: text
  status: PENDING | APPROVED | REJECTED | CANCELLED
  approved_by: UUID
  approval_date: TIMESTAMP
}
```

### Salary Record
```typescript
{
  id: UUID
  employee_id: UUID
  month: string (YYYY-MM)
  base_salary: decimal
  bonus: decimal
  deductions: decimal
  net_salary: decimal
  status: DRAFT | FINALIZED | PAID
  paid_date: TIMESTAMP
}
```

### Performance Review
```typescript
{
  id: UUID
  employee_id: UUID
  review_period_start: DATE
  review_period_end: DATE
  reviewer_id: UUID
  overall_rating: decimal (0-5)
  punctuality_rating: decimal
  quality_rating: decimal
  teamwork_rating: decimal
  attitude_rating: decimal
  skills_rating: decimal
  comments: text
  strengths: text
  areas_for_improvement: text
  status: DRAFT | SUBMITTED | ACKNOWLEDGED
}
```

## Integration Steps

### Step 1: Setup Database
```bash
cd backend
psql -U postgres -d smartserve < database/schema/006_create_employees_schema.sql
```

### Step 2: Register Routes in Main Server
```typescript
// backend/src/server.ts
import employeesRouter from './modules/employees/employees.controller';
app.use('/api/restaurants', employeesRouter);
```

### Step 3: Add Types to TypeScript
```typescript
// backend/src/modules/employees/employees.types.ts
export interface Employee { ... }
export interface Attendance { ... }
// etc.
```

## Key Features

### 1. Attendance Tracking
- Check-in/Check-out system
- Automatic duration calculation
- Status tracking (PRESENT, ABSENT, LATE, HALF_DAY)
- Daily reports

### 2. Shift Management
- Create custom shifts
- Assign employees to shifts
- Shift tracking and completion

### 3. Leave Management
- Multiple leave types (Sick, Casual, Earned, Maternity)
- Approval workflow
- Duration calculation
- Leave history

### 4. Payroll
- Monthly salary processing
- Bonus/deduction tracking
- Status workflow (DRAFT → FINALIZED → PAID)
- Salary history

### 5. Performance Management
- Multi-criteria ratings (Punctuality, Quality, Teamwork, etc.)
- Detailed feedback
- Rating scale 0-5
- Performance tracking

## Access Control

All endpoints protected with RBAC:
- **RESTAURANT_OWNER**: Full access
- **MANAGER**: Can manage employees, attendance, salary, reviews
- **WAITER/KITCHEN_STAFF/CASHIER**: Can check-in/check-out, request leave

## Common Workflows

### Employee Onboarding
```
1. POST /employees - Create employee record
2. Create shifts assignment
3. Send employee credentials
4. Employee can mark attendance
```

### Monthly Payroll
```
1. GET /attendance - Generate attendance report
2. POST /salary - Create salary record
3. Review deductions/bonuses
4. POST /salary/:id/finalize - Finalize for payment
```

### Leave Approval
```
1. Employee: POST /leave/request
2. Manager: GET /leave?status=PENDING
3. Manager: POST /leave/:id/approve
4. System updates employee status to ON_LEAVE
```

### Performance Review Cycle
```
1. Manager: POST /performance-review - Create review
2. Manager: Enter ratings and feedback
3. POST to finalize review
4. Employee sees review in portal
```

## Analytics Capabilities

The system enables reporting on:
- Attendance rate by employee/role/period
- Average shift duration
- Leave consumption by type
- Salary trends
- Performance ratings over time
- Turnover analysis

## Future Enhancements

- [ ] Biometric/Face recognition for attendance
- [ ] Mobile app for check-in
- [ ] Automated salary calculation with tax computation
- [ ] Leave balance tracking and carryover
- [ ] Performance improvement plans (PIP)
- [ ] Training and certification tracking
- [ ] Employee self-service portal
- [ ] Integration with payroll systems
- [ ] Attendance geofencing
- [ ] Email/SMS notifications
