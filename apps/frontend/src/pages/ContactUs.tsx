import React, { useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

const ContactUs = () => {
  const [submitted, setSubmitted] = useState(false);
  const [details, setDetails] = useState({ name: '', email: '', message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-800 via-dark-900 to-dark-800 px-4 py-12">
      <div className="bg-white/5 border border-white/10 rounded-2xl shadow-xl p-8 max-w-lg w-full backdrop-blur-xl">
        <h2 className="text-3xl font-bold text-primary-400 mb-4 text-center">Contact Us</h2>
        <p className="text-gray-300 mb-8 text-center">
          Have questions, feedback, or need support? Reach out to our team!
        </p>
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Mail className="w-6 h-6 text-primary-400" />
            <span className="text-white">dled@iitrpr.ac.in</span>
          </div>
          <div className="flex items-center gap-4">
            <Phone className="w-6 h-6 text-primary-400" />
            <span className="text-white">+91 734-0753010</span>
          </div>
          <div className="flex items-center gap-4">
            <MapPin className="w-6 h-6 text-primary-400" />
            <span className="text-white">Indian Institute of Technology Ropar, Punjab, India</span>
          </div>
        </div>
        <div className="mt-8">
          {!submitted ? (
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                className="px-4 py-2 rounded-lg bg-dark-900 text-white border border-white/10 focus:outline-none focus:border-primary-400"
                required
                value={details.name}
                onChange={handleChange}
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                className="px-4 py-2 rounded-lg bg-dark-900 text-white border border-white/10 focus:outline-none focus:border-primary-400"
                required
                value={details.email}
                onChange={handleChange}
              />
              <textarea
                name="message"
                placeholder="Your Message"
                rows={4}
                className="px-4 py-2 rounded-lg bg-dark-900 text-white border border-white/10 focus:outline-none focus:border-primary-400"
                required
                value={details.message}
                onChange={handleChange}
              />
              <button
                type="submit"
                className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-2 rounded-xl shadow-lg transition-all duration-200"
              >
                Send Message
              </button>
            </form>
          ) : (
            <div className="text-center text-white">
              <h3 className="text-xl font-semibold mb-2">Thank you for contacting us!</h3>
              <p className="mb-4">We have received your details and will contact you soon.</p>
              <div className="bg-dark-900/60 rounded-lg p-4 text-left mx-auto max-w-xs">
                <div><span className="font-semibold">Name:</span> {details.name}</div>
                <div><span className="font-semibold">Email:</span> {details.email}</div>
                <div><span className="font-semibold">Message:</span> {details.message}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactUs;