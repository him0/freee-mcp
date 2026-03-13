import { z } from 'zod';

export type Credentials = {
  clientId: string;
  clientSecret: string;
  callbackPort: number;
};

export type OAuthResult = {
  accessToken: string;
  refreshToken: string;
};

export type SelectedCompany = {
  id: number;
  name: string | null;
  displayName: string;
  role: string;
};

export const CompanySchema = z.object({
  id: z.number(),
  name: z.string().nullable(),
  name_kana: z.string().nullable().optional(),
  display_name: z.string(),
  role: z.string(),
});

export const CompaniesResponseSchema = z.object({
  companies: z.array(CompanySchema).optional(),
});

export type Company = z.infer<typeof CompanySchema>;

export const HrCompanySchema = z.object({
  id: z.number(),
  name: z.string().nullable(),
  name_kana: z.string().nullable().optional(),
  display_name: z.string().nullable().optional(),
  role: z.string(),
  external_cid: z.string().optional(),
  employee_id: z.number().nullable().optional(),
});

export const HrUsersMeResponseSchema = z.object({
  id: z.number(),
  companies: z.array(HrCompanySchema).optional(),
});
