export interface LoginCompanyUser {
    accountID: string;
    accountName: string;
    paymentHandle: string;
    companyName: string;
    description: string;
}

export const defaultLoginCompanyUser: LoginCompanyUser = {
    accountID: "",
    accountName: "",
    paymentHandle: "",
    companyName: "",
    description: "",
};


export interface LoginAccount {
    accountID: string;
    accountName: string;
    paymentHandle: string;
    description: string;
    
}

export const defaultLoginAccount: LoginAccount = {
    accountID: "",
    accountName: "",
    paymentHandle: "",
    description: "",
};