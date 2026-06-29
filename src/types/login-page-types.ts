export interface LoginCompanyUser {
    accountID: string;
    accountName: string;
    displayName: string;
    companyName: string;
    description: string;
}

export const defaultLoginCompanyUser: LoginCompanyUser = {
    accountID: "",
    accountName: "",
    displayName: "",
    companyName: "",
    description: "",
};


export interface LoginAccount {
    accountID: string;
    accountName: string;
    displayName: string;
    description: string;
    
}

export const defaultLoginAccount: LoginAccount = {
    accountID: "",
    accountName: "",
    displayName: "",
    description: "",
};