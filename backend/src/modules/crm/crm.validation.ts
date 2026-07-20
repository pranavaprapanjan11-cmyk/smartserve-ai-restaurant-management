import Joi from 'joi';
import { ReservationStatus, WaitlistStatus } from './crm.types';

export const createCustomerSchema = Joi.object({
  name: Joi.string().optional().allow('', null),
  phone_number: Joi.string().min(5).required(),
  email: Joi.string().email().optional().allow('', null),
  birthday: Joi.string().optional().allow('', null),
  anniversary: Joi.string().optional().allow('', null),
  notes: Joi.string().optional().allow('', null),
  preferred_seating: Joi.string().optional().allow('', null),
  preferred_dishes: Joi.any().optional()
});

export const updateCustomerSchema = createCustomerSchema.fork(
  ['phone_number'],
  (schema) => schema.optional()
);

export const createReservationSchema = Joi.object({
  customer_id: Joi.string().uuid().required(),
  reservation_date: Joi.string().required(),
  reservation_time: Joi.string().required(),
  guest_count: Joi.number().integer().min(1).required(),
  requested_table: Joi.string().uuid().optional().allow(null),
  notes: Joi.string().optional().allow('', null)
});

export const updateReservationStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(ReservationStatus)).required(),
  requested_table: Joi.string().uuid().optional().allow(null)
});

export const createWaitlistEntrySchema = Joi.object({
  customer_id: Joi.string().uuid().optional().allow(null),
  customer_name: Joi.string().optional().allow('', null),
  phone_number: Joi.string().optional().allow('', null),
  party_size: Joi.number().integer().min(1).required(),
  estimated_wait_mins: Joi.number().integer().optional().allow(null),
  notes: Joi.string().optional().allow('', null)
});

export const updateWaitlistStatusSchema = Joi.object({
  status: Joi.string().valid(...Object.values(WaitlistStatus)).required(),
  estimated_wait_mins: Joi.number().integer().optional().allow(null)
});

import { Request, Response, NextFunction } from 'express';

function validate(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ errors: error.details.map((d) => d.message) });
    }
    req.body = value as any;
    next();
  };
}

export const validateCreateCustomer = validate(createCustomerSchema);
export const validateUpdateCustomer = validate(updateCustomerSchema);
export const validateCreateReservation = validate(createReservationSchema);
export const validateUpdateReservationStatus = validate(updateReservationStatusSchema);
export const validateCreateWaitlistEntry = validate(createWaitlistEntrySchema);
export const validateUpdateWaitlistStatus = validate(updateWaitlistStatusSchema);
