import Sms, { ISms } from "../models/smsModal";




export const sendTextMessage = async (message: string, phone: string, reciever: string, ref: string) => {
    let sender_id = "Champ_Int"
    let api_key = "9b41859b01914a75a2a899b9f61dec93"
    let dataIn = {
        api_key,
        sender_id,
        message,
        phone
    }
    try {
        const response: any = await fetch('https://sms.blessedtexts.com/api/sms/v1/sendsms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(dataIn)
        });

        const data = await response.json();

        let body: ISms | any = {
            reciever: reciever,
            message: dataIn.message,
            message_id: "",
            status_code: "",
            status_desc: "",
            ref: ref

        }  
        if (Array.isArray(data) && data[0].status_code === "1000") {
            body.status_code = data[0].status_code
            body.status_desc = data[0].status_desc
            body.message_id = data[0].message_id
            const message = new Sms(body);
            await message.save();
            return {
                success: true,
                data
            }
        }
        else {
            body.status_code = data.status_code
            body.status_desc = data.status_desc
            const message = new Sms(body);
            await message.save();
            return {
                success: false,
                data
            }
        }

    } catch (error: any) {
        console.error('Error:', error);
        return {
            success: false,
            error: error.message
        }

    }
}

export const getTextBalance = async (message: string, phone: string, reciever: string, ref: string) => {
    let sender_id = "Champ_Int"
    let api_key = "9b41859b01914a75a2a899b9f61dec93"
    let dataIn = {
        api_key,
        sender_id,
        message,
        phone
    }
    try {
        const response: any = await fetch('https://sms.blessedtexts.com/api/sms/v1/balnce', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(dataIn)
        });

        const data = await response.json();

        let body: ISms | any = {
            reciever: reciever,
            message: dataIn.message,
            message_id: "",
            status_code: "",
            status_desc: "",
            ref: ref

        }  
        if (Array.isArray(data) && data[0].status_code === "1000") {
            body.status_code = data[0].status_code
            body.status_desc = data[0].status_desc
            body.message_id = data[0].message_id
            const message = new Sms(body);
            await message.save();
            return {
                success: true,
                data
            }
        }
        else {
            body.status_code = data.status_code
            body.status_desc = data.status_desc
            const message = new Sms(body);
            await message.save();
            return {
                success: false,
                data
            }
        }

    } catch (error: any) {
        console.error('Error:', error);
        return {
            success: false,
            error: error.message
        }

    }
}