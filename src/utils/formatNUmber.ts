export const Format_phone_number = (phone_number: number | any) => {

    let Refined
    if (phone_number.charAt(0) === "0") {
        let newPhone = phone_number.slice(1);
        Refined = "+254".concat(newPhone)
        return Refined
    }
    else if (phone_number.substring(0, 4) === "+254") {
        return phone_number
    }

}

export const toLocalPhoneNumber = (phone: string | any) => {
    if (phone.startsWith('+254')) {
        return '' + phone.slice(1); // Replace +254 with 0
    }
    return phone; // Return as-is if already local
}