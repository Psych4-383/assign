const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const responseSchema = new Schema({
    id: {
        type: String,
        required: true
    },
    response: {
        data: Buffer,
        contentType: String,
    },
    date: {
        type: Date,
        required: true
    },
    submittedBy: {
        type: Object,
        required: true
    },

}
, { timestamps: true });

const Response = mongoose.model('Response', responseSchema);
module.exports = Response;
