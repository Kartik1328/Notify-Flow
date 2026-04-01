import Joi from "joi";

export const createJobSchema = Joi.object({
  type: Joi.string().valid("SEND_REMINDER", "GENERATE_REPORT").required(),
  scheduledAt: Joi.date().greater("now").required(), // must be future date
  payload: Joi.object().required(),
});
