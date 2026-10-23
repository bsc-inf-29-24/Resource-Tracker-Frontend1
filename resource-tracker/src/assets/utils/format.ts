export function formatCurrency(amount: number): string {
    return `MWK ${amount.toLocaleString("en-us")}`;
}

export function formatDate(iso: string): string {
    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric" ,
    });
}