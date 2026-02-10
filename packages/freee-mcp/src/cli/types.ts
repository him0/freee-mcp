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
  name: string;
  displayName: string;
  role: string;
};

export const CompanySchema = z.object({
  id: z.number(),
  name: z.string().nullable().transform((val) => val ?? '事業所の正式名称（未設定）'),
  display_name: z.string(),
  role: z.string(),
});

export const CompaniesResponseSchema = z.object({
  companies: z.array(CompanySchema).optional(),
});

export type Company = z.infer<typeof CompanySchema>;
