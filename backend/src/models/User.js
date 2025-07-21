// Ejemplo de modelo User
// import mongoose from 'mongoose';

// const userSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     lowercase: true
//   },
//   password: {
//     type: String,
//     required: true,
//     minlength: 6
//   },
//   role: {
//     type: String,
//     enum: ['user', 'admin'],
//     default: 'user'
//   },
//   membership: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Membership'
//   }
// }, {
//   timestamps: true
// });

// export default mongoose.model('User', userSchema);
