import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, BookOpen, Mail, Users, ArrowLeft, Send, Sparkles, MapPin, Building, Phone, Clock, CheckCircle } from 'lucide-react';

interface AuxPagesProps {
  initialTab: 'about' | 'privacy' | 'terms' | 'contact';
  onClose: () => void;
}

export default function AuxPages({ initialTab, onClose }: AuxPagesProps) {
  const [activeTab, setActiveTab] = useState<'about' | 'privacy' | 'terms' | 'contact'>(initialTab);
  
  // Contact Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    
    // Simulate generation of a secure ticket reference ID
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    setTicketId(`SHN-${randomNum}`);
    setIsSubmitted(true);
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setCategory('general');
    setSubject('');
    setMessage('');
    setIsSubmitted(false);
    setTicketId('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 animate-in fade-in duration-300">
      {/* Top Header Back Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-5 mb-8">
        <button
          onClick={onClose}
          className="group flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Floorplanner Workspace</span>
        </button>

        <span className="text-[10px] font-mono font-extrabold text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full border border-blue-100 dark:border-blue-900/30">
          Corporate Center
        </span>
      </div>

      {/* Tabs Menu Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
        <button
          onClick={() => { setActiveTab('about'); setIsSubmitted(false); }}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-extrabold tracking-wide uppercase transition ${
            activeTab === 'about'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/60 dark:border-slate-850'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>About Us</span>
        </button>

        <button
          onClick={() => { setActiveTab('privacy'); setIsSubmitted(false); }}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-extrabold tracking-wide uppercase transition ${
            activeTab === 'privacy'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/60 dark:border-slate-850'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Privacy Policy</span>
        </button>

        <button
          onClick={() => { setActiveTab('terms'); setIsSubmitted(false); }}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-extrabold tracking-wide uppercase transition ${
            activeTab === 'terms'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/60 dark:border-slate-850'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Terms of Service</span>
        </button>

        <button
          onClick={() => { setActiveTab('contact'); setIsSubmitted(false); }}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-extrabold tracking-wide uppercase transition ${
            activeTab === 'contact'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200/60 dark:border-slate-850'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Contact Us</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 md:p-10 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/2 animate-pulse rounded-full blur-3xl pointer-events-none" />

        {/* 1. ABOUT US TAB */}
        {activeTab === 'about' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded-full">
                <Sparkles className="w-3.5 h-3.5" /> Our Architectural Vision
              </span>
              <h3 className="text-2xl md:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
                About Smart Home Naqsha
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
                Smart Home Naqsha is an advanced procedural spatial modeling platform created to make elegant 2D layout planning and interactive 3D visualizations accessible to everyone. Our primary mission is to democratize housing design, bypassing expensive license limitations to provide standard-compliant blueprint layouts to homeowners, students, civil draftsmen, and independent design professionals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-850">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-200 mb-2">Procedural Architecture</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Our custom design engine analyzes plot parameters instantly, calculating setbacks, door placements, and window offsets to maximize natural lighting, ventilation, and functional room organization.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-850">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-200 mb-2">Interactive 3D Engine</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Toggle perspective camera projections, orthographic layouts, roof slab overlays, and realistic ambient daylight controls. Walk through generated spaces in first-person using simple controls.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-850">
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-200 mb-2">Privacy & Client-First</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  No account registrations, no mandatory cloud syncs, and no hidden server data leakage. Your project calculations are processed purely within your device's browser sandbox for ultimate safety.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-150 dark:border-slate-800/80 space-y-4">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-200 uppercase tracking-wider">The Concept Behind Our Workspace</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                In traditional design culture, a <strong>"Naqsha"</strong> is a physical map, layout, or schematic layout that represents the foundation of a structure. By fusing this traditional methodology with contemporary browser rendering, CSS-based canvas, and high-precision geometrical math, we provide users with a playground to iterate their thoughts.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Whether you are experimenting with professional setback offsets, trying different room paint styles, selecting unique wall and wood trimmings, or export-ready blueprint vector designs, Smart Home Naqsha provides you with a zero-friction spatial modeling workbench.
              </p>
            </div>
          </motion.div>
        )}

        {/* 2. PRIVACY POLICY TAB */}
        {activeTab === 'privacy' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 text-xs text-slate-600 dark:text-slate-450 leading-relaxed"
          >
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                Privacy Policy
              </h3>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Last Updated: July 2026
              </p>
            </div>

            <p>
              At Smart Home Naqsha, accessible from this web application, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Smart Home Naqsha and how we use it.
            </p>
            <p>
              If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us through our dedicated Contact form.
            </p>

            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">1. Local-First Sandboxed Environment</h4>
                <p>
                  Any layouts, room dimensions, wall finishes, furniture placements, or project names that you configure in our system are stored strictly within your browser's sandboxed <strong>localStorage</strong>. None of these structural details are uploaded, cached, or recorded on external databases. They are kept entirely in memory on your personal local machine.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">2. Log Files & Standard Analytics</h4>
                <p>
                  Smart Home Naqsha follows a standard procedure of using log files. These files log visitors when they visit web applications. All hosting companies do this as part of hosting services' analytics. The information collected by log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users' movement on the website, and gathering demographic information.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">3. Google DoubleClick DART Cookies & Advertisers</h4>
                <p>
                  Google is one of the third-party vendors on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to our web application and other sites on the internet. However, visitors may choose to decline the use of DART cookies by visiting the Google ad and content network Privacy Policy at the following URL – <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">https://policies.google.com/technologies/ads</a>
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">4. Third-Party Privacy Policies</h4>
                <p>
                  Smart Home Naqsha's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information. It may include their practices and instructions about how to opt-out of certain options.
                </p>
                <p className="mt-1">
                  You can choose to disable cookies through your individual browser options. To know more detailed information about cookie management with specific web browsers, it can be found at the browsers' respective websites.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">5. CCPA Privacy Rights (Do Not Sell My Personal Information)</h4>
                <p>
                  Under the CCPA, among other rights, California consumers have the right to request that a business disclose the categories and specific pieces of personal data that a business has collected about consumers. Because we run a stateless on-device procedural algorithm and do not collect, serialize, or transmit personal identity attributes to external databases, we do not trade, sell, or rent any of your personal data.
                </p>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">6. GDPR Data Protection Rights</h4>
                <p>
                  We want to make sure you are fully aware of all of your data protection rights. Every user is entitled to the following:
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li><strong>The right to access</strong> – You have the right to inspect your saved browser records. You can view or delete your layouts at any time via the Project Library.</li>
                  <li><strong>The right to rectification</strong> – You can edit and update any layouts saved on your device instantly.</li>
                  <li><strong>The right to erasure</strong> – You can permanently erase all local layouts and presets at any time.</li>
                </ul>
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">7. Children's Information</h4>
                <p>
                  Another part of our priority is adding protection for children while using the internet. We encourage parents and guardians to observe, participate in, and/or monitor and guide their online activity. Smart Home Naqsha does not knowingly collect any Personal Identifiable Information from children under the age of 13.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* 3. TERMS OF SERVICE TAB */}
        {activeTab === 'terms' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 text-xs text-slate-600 dark:text-slate-450 leading-relaxed"
          >
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                Terms and Conditions
              </h3>
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Authorized Use, Licensing, and Limitations
              </p>
            </div>

            <p>
              Welcome to Smart Home Naqsha! These terms and conditions outline the rules and regulations for the use of Smart Home Naqsha's Web Application. By accessing this web application, we assume you accept these terms and conditions. Do not continue to use Smart Home Naqsha if you do not agree to take all of the terms and conditions stated on this page.
            </p>

            <div className="space-y-4 pt-2">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl">
                <h4 className="text-xs font-extrabold text-amber-800 dark:text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                  ⚠️ Critical Engineering Disclaimer
                </h4>
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1.5 leading-relaxed font-semibold">
                  Smart Home Naqsha is a design-centric visualization and conceptual planning workbench. Any plans, structural layouts, and dimension offsets generated by this application are for illustrative, exploratory, and educational purposes only. They DO NOT replace professional architectural drawings, regional municipal codes, soil safety assessments, or load-bearing civil calculations. You MUST consult a certified structural engineer and a licensed physical architect before construction or legal submission of site plans.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">1. License and Intellectual Property Rights</h4>
                <p>
                  Unless otherwise stated, Smart Home Naqsha owns the intellectual property rights for all code, components, style assets, and visual models contained within the software shell. All intellectual property rights are reserved. You may access this for your own personal or professional use subjected to restrictions set in these terms and conditions.
                </p>
                <p className="mt-1">
                  However, <strong>any design layouts, 2D floor plans, 3D snapshots, coordinate dimensions, and blueprint files generated by you</strong> on this application are 100% owned by you. We impose zero royalty fees, licensing claims, or distribution lock-outs. You are free to commercialize, distribute, or physically construct based on your exported designs.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">2. Prohibited Activities</h4>
                <p>
                  You are specifically restricted from all of the following:
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>Selling, sublicensing, or commercializing the core Smart Home Naqsha code or bundle package without prior authorization.</li>
                  <li>Using this web application in any way that is or may be damaging to this website or access services.</li>
                  <li>Using this web application contrary to applicable regional civil building laws and guidelines.</li>
                </ul>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">3. Limitations of Liability</h4>
                <p>
                  In no event shall Smart Home Naqsha, nor any of its contributors or developers, be held liable for anything arising out of or in any way connected with your use of this web application. Smart Home Naqsha shall not be held liable for any indirect, consequential, structural, physical, monetary, or regulatory damages arising out of your utilization of custom floor plan layouts or model specifications.
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider">4. Severability</h4>
                <p>
                  If any provision of these Terms is found to be invalid under any applicable law, such provisions shall be deleted without affecting the remaining provisions herein.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* 4. CONTACT US TAB */}
        {activeTab === 'contact' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-950 dark:text-white tracking-tight">
                Architectural Support Hub
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Have a feature request, licensing question, or technical query? Drop us a line below.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Form Side */}
              <div className="lg:col-span-7 space-y-6">
                {isSubmitted ? (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 p-6 rounded-3xl text-center space-y-4"
                  >
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400">
                        Query Lodged Successfully!
                      </h4>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-500">
                        We have logged your query in our high-priority support stream.
                      </p>
                    </div>

                    <div className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850 inline-block font-mono text-[11px]">
                      Ticket Reference: <span className="font-extrabold text-blue-600 dark:text-blue-400">{ticketId}</span>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-normal max-w-xs mx-auto">
                      A representative or agent will review your layout parameters and email you back within 12 business hours.
                    </p>

                    <button
                      onClick={resetForm}
                      className="px-4 py-2 bg-slate-150 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-[10px] font-bold uppercase tracking-wider transition"
                    >
                      Send Another Message
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Architect Sarah"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. sarah@naqsha.org"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
                          Stream Category
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-300"
                        >
                          <option value="general">General Inquiry</option>
                          <option value="technical">Technical Support</option>
                          <option value="custom">Custom Layout Proposals</option>
                          <option value="partnership">Enterprise Licensing</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
                          Subject Line
                        </label>
                        <input
                          type="text"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="e.g. 3D Model Rendering Feedback"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 block">
                        Message Body
                      </label>
                      <textarea
                        required
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                        placeholder="Detail your request or layout question..."
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/40 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-lg hover:shadow-blue-500/10 transition-all flex items-center justify-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Transmit Message</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Info Sidebar Side */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-slate-50 dark:bg-slate-950/40 p-6 rounded-3xl border border-slate-100 dark:border-slate-850 space-y-5">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    HQ Coordinates
                  </h4>

                  <div className="space-y-4 text-xs">
                    <div className="flex items-start gap-3">
                      <Building className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">Smart Home Naqsha Lab</p>
                        <p className="text-slate-400 dark:text-slate-500 mt-0.5">Plot 45-B, Sector D-12, Islamabad, PK</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">Direct Inquiries</p>
                        <p className="text-slate-400 dark:text-slate-500 mt-0.5">+92 (51) 884-9011</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">Lab Operations</p>
                        <p className="text-slate-400 dark:text-slate-500 mt-0.5">Mon - Sat (09:00 AM - 06:00 PM PST)</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">Geo Location</p>
                        <p className="text-slate-400 dark:text-slate-500 mt-0.5">33.7294° N, 73.0617° E</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
