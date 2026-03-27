
import mongoose, { Schema, Document, Types } from "mongoose";


export interface ISms extends Document {

    receiver: Types.ObjectId;
    message: string;
    status_code: string;
    status_desc: string;
    message_id: string;
    ref: "account-activation" | "password-reset" |"appontment-cancellation"
    timestamp: Date;

}
const SmsSchema = new Schema<ISms>({

    receiver: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    },
    message: { type: String, required: true },
    status_code: { type: String, required: true },
    message_id: { type: String },
    status_desc: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    ref: { type: String, enum: ["account-activation", "password-reset"], default: "account-activation" },
});
SmsSchema.index({ sender: 1, receiver: 1, timestamp: 1 });
const Sms = mongoose.model<ISms>("sms_logs_tb", SmsSchema);

export default Sms;