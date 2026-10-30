import React from 'react';
import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isAnalyticsConfigured, openCookiePreferences } from '../components/CookieConsent';

const DraftNotice: React.FC = () => (
  <div
    role="note"
    className="mb-8 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950"
  >
    <strong>Draft — requires operator and legal review.</strong> The service operator, applicable
    jurisdiction, public contact details, hosting/retention arrangements, and approved policy terms
    have not been supplied. Do not treat this draft as legal advice or publish it as a final policy.
  </div>
);

const PublicPage: React.FC<{ children: React.ReactNode; title: string }> = ({
  children,
  title,
}) => (
  <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 sm:py-16">
    <article className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
      <Link
        to="/"
        className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-teal-800 hover:text-teal-950"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to ArogyaSathi
      </Link>
      <h1 className="mb-6 flex items-center gap-3 text-3xl font-extrabold tracking-tight text-slate-900">
        <FileText className="h-7 w-7 text-teal-700" />
        {title}
      </h1>
      {children}
    </article>
  </main>
);

export const PrivacyPage: React.FC = () => (
  <PublicPage title="Privacy notice">
    <DraftNotice />
    <div className="space-y-7 text-sm leading-7 text-slate-700">
      <section>
        <h2 className="mb-2 text-lg font-bold text-slate-900">Information handled</h2>
        <p>
          Authorized facility users may enter facility and staff details, family and household
          information, health records, schedules, referrals, and reports. The information actually
          collected depends on how the service operator configures and uses the application.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-bold text-slate-900">Use and access</h2>
        <p>
          The application supports facility operations, care coordination, reporting, and
          communication between affiliated health facilities. Facility roles restrict access within
          the application. The operator is responsible for authorizing users and determining who may
          access records.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-bold text-slate-900">Storage and retention</h2>
        <p>
          Records are stored in the database configured by the service operator. The operator must
          document the hosting location, retention period, backup practices, and process for
          correction or deletion before this notice is finalized.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-bold text-slate-900">Cookies and analytics</h2>
        <p>
          A necessary session cookie is used to keep authorized users signed in. Optional Plausible
          page-view analytics are disabled unless configured and are sent only after consent on
          public pages. Clinical workspace pages and clinical records are not sent as analytics
          events. You can change your choice below.
        </p>
        {isAnalyticsConfigured ? (
          <button
            type="button"
            onClick={openCookiePreferences}
            className="mt-3 font-semibold text-teal-800 underline"
          >
            Change analytics preferences
          </button>
        ) : (
          <p className="mt-3 text-slate-600">
            Optional analytics are not enabled on this deployment.
          </p>
        )}
      </section>
      <section>
        <h2 className="mb-2 text-lg font-bold text-slate-900">Contact</h2>
        <p>
          A verified public privacy contact has not been supplied. Contact your facility
          administrator for assistance. The service operator must add a public contact and explain
          the applicable privacy rights and request process before publication.
        </p>
      </section>
    </div>
  </PublicPage>
);

export const TermsPage: React.FC = () => (
  <PublicPage title="Terms of use">
    <DraftNotice />
    <div className="space-y-7 text-sm leading-7 text-slate-700">
      <section>
        <h2 className="mb-2 text-lg font-bold text-slate-900">Authorized use</h2>
        <p>
          Use this application only with an account and facility access granted by the service
          operator. Keep credentials private, use only the information needed for assigned duties,
          and sign out when finished on a shared device.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-bold text-slate-900">Clinical information</h2>
        <p>
          This application supports record keeping and coordination; it does not replace
          professional clinical judgment, emergency services, or applicable health protocols.
          Authorized users are responsible for checking information and following their facility’s
          approved procedures.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-bold text-slate-900">Operator responsibilities</h2>
        <p>
          The service operator is responsible for account authorization, staff training, data
          governance, applicable notices and permissions, retention, support, and incident handling.
          No public operator identity, contact address, jurisdiction, or service-level commitment
          has been provided for this draft.
        </p>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-bold text-slate-900">Questions</h2>
        <p>
          Contact your facility administrator. The operator must replace this placeholder with
          reviewed terms and verified contact details before public deployment.
        </p>
      </section>
    </div>
  </PublicPage>
);

export const NotFoundPage: React.FC = () => (
  <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
    <section className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
      <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-teal-700" aria-hidden="true" />
      <p className="text-sm font-bold uppercase tracking-widest text-teal-800">404 — Not found</p>
      <h1 className="mt-3 text-3xl font-extrabold text-slate-900">This page isn’t here</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        The address may be outdated, or the page may have moved.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white hover:bg-teal-800"
        >
          Go to home
        </Link>
        <Link
          to="/login"
          className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          Facility sign in
        </Link>
      </div>
    </section>
  </main>
);
