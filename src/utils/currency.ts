export function getCurrencySymbol(currency: string) {
    switch(currency) {
        case "USD":
            return "$";
        case "EUR":
            return "€";
        case "GBP":
            return "£";
        default:
            return "₹";
    }
}