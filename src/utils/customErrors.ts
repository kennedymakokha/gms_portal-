export const CustomError = (
    validator: (body: any) => { errors: any; isValid: boolean },
    body: any,
    res: Response | any
): boolean => {
    const { errors, isValid } = validator(body);

    if (!isValid) {
        const firstError = Object.values(errors)[0];
        res.status(400).json(firstError);
        return false; // <== Tell controller to stop
    }

    return true;
};