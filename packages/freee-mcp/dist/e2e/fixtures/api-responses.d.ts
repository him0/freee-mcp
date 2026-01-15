/**
 * Mock API responses for E2E testing
 * These fixtures simulate freee API responses
 */
export declare const mockUserResponse: {
    user: {
        id: number;
        email: string;
        display_name: string;
        first_name: string;
        last_name: string;
        first_name_kana: string;
        last_name_kana: string;
    };
};
export declare const mockCompaniesResponse: {
    companies: {
        id: number;
        name: string;
        name_kana: string;
        display_name: string;
        role: string;
    }[];
};
export declare const mockDealsResponse: {
    deals: {
        id: number;
        company_id: number;
        issue_date: string;
        due_date: string;
        amount: number;
        type: string;
        ref_number: string;
        status: string;
    }[];
    meta: {
        total_count: number;
    };
};
export declare const mockDealResponse: {
    deal: {
        id: number;
        company_id: number;
        issue_date: string;
        due_date: string;
        amount: number;
        type: string;
        ref_number: string;
        status: string;
        partner_id: number;
        partner_name: string;
        details: {
            id: number;
            account_item_id: number;
            account_item_name: string;
            tax_code: number;
            amount: number;
            description: string;
        }[];
    };
};
export declare const mockPartnersResponse: {
    partners: {
        id: number;
        company_id: number;
        name: string;
        code: string;
        shortcut1: string;
    }[];
};
export declare const mockAccountItemsResponse: {
    account_items: {
        id: number;
        name: string;
        shortcut: string;
        account_category: string;
        account_category_id: number;
    }[];
};
export declare const mockInvoicesResponse: {
    invoices: {
        id: string;
        company_id: number;
        invoice_number: string;
        partner_name: string;
        invoice_date: string;
        due_date: string;
        total_amount: number;
        invoice_status: string;
    }[];
    meta: {
        total_count: number;
    };
};
export declare const mockEmployeesResponse: {
    employees: {
        id: number;
        company_id: number;
        num: string;
        display_name: string;
        email: string;
        entry_date: string;
    }[];
};
export declare const mockProjectsResponse: {
    projects: {
        id: number;
        company_id: number;
        name: string;
        code: string;
        status: string;
    }[];
};
export declare const mockUnauthorizedResponse: {
    error: string;
    error_description: string;
};
export declare const mockNotFoundResponse: {
    status_code: number;
    errors: {
        type: string;
        messages: string[];
    }[];
};
export declare const mockTokenResponse: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
    created_at: number;
};
