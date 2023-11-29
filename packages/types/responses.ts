import { z } from "zod";
import { ZPerson, ZPersonAttributes } from "./people";
import { ZSurvey } from "./surveys";
import { ZTag } from "./tags";

export const ZResponseData = z.record(z.union([z.string(), z.number(), z.array(z.string())]));

export type TResponseData = z.infer<typeof ZResponseData>;

export const ZResponsePersonAttributes = ZPersonAttributes.nullable();

export type TResponsePersonAttributes = z.infer<typeof ZResponsePersonAttributes>;

export const ZResponseNoteUser = z.object({
  id: z.string().cuid2(),
  name: z.string().nullable(),
});

export type TResponseNoteUser = z.infer<typeof ZResponseNoteUser>;

const ZResponseNote = z.object({
  updatedAt: z.date(),
  createdAt: z.date(),
  id: z.string(),
  text: z.string(),
  user: ZResponseNoteUser,
  isResolved: z.boolean(),
  isEdited: z.boolean(),
});

export type TResponseNote = z.infer<typeof ZResponseNote>;

export const ZResponseMeta = z.object({
  source: z.string().optional(),
  url: z.string().optional(),
  userAgent: z.object({
    browser: z.string().optional(),
    os: z.string().optional(),
    device: z.string().optional(),
  }),
});

export type TResponseMeta = z.infer<typeof ZResponseMeta>;

export const ZResponse = z.object({
  id: z.string().cuid2(),
  createdAt: z.date(),
  updatedAt: z.date(),
  surveyId: z.string().cuid2(),
  person: ZPerson.nullable(),
  personAttributes: ZResponsePersonAttributes,
  finished: z.boolean(),
  data: ZResponseData,
  notes: z.array(ZResponseNote),
  tags: z.array(ZTag),
  meta: ZResponseMeta.nullable(),
  singleUseId: z.string().nullable(),
  language: z.string().nullable(),
});

export type TResponse = z.infer<typeof ZResponse>;

export type TResponseDates = {
  createdAt: TResponse["createdAt"];
  updatedAt: TResponse["updatedAt"];
  notes: TResponse["notes"];
};

export const ZResponseInput = z.object({
  environmentId: z.string().cuid2(),
  surveyId: z.string().cuid2(),
  userId: z.string().nullish(),
  singleUseId: z.string().nullable().optional(),
  finished: z.boolean(),
  language: z.string().optional(),
  data: ZResponseData,
  meta: z
    .object({
      source: z.string().optional(),
      url: z.string().optional(),
      userAgent: z
        .object({
          browser: z.string().optional(),
          device: z.string().optional(),
          os: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

export type TResponseInput = z.infer<typeof ZResponseInput>;

export const ZResponseLegacyInput = ZResponseInput.omit({ userId: true, environmentId: true }).extend({
  personId: z.string().cuid2().nullable(),
});

export type TResponseLegacyInput = z.infer<typeof ZResponseLegacyInput>;

export const ZResponseUpdateInput = z.object({
  finished: z.boolean(),
  data: ZResponseData,
});

export type TResponseUpdateInput = z.infer<typeof ZResponseUpdateInput>;

export const ZResponseWithSurvey = ZResponse.extend({
  survey: ZSurvey,
});

export type TResponseWithSurvey = z.infer<typeof ZResponseWithSurvey>;

export const ZResponseUpdate = z.object({
  finished: z.boolean(),
  data: ZResponseData,
  language: z.string().optional(),
  meta: z
    .object({
      url: z.string().optional(),
      source: z.string().optional(),
    })
    .optional(),
});

export type TResponseUpdate = z.infer<typeof ZResponseUpdate>;
