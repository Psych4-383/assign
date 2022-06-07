const mongoose = require('mongoose')
const { listenerCount } = require('./user')
const Schema = mongoose.Schema

const assignmentSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    maximumMarks: {
        type: Number,
        required: true
    },
    assignedBy: {
        type: String,
        required: true
    },
}, { timestamps: true })

const Assignment = mongoose.model('Assignment', assignmentSchema)
module.exports = Assignment;