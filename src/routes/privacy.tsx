import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [{ title: "Privacy Policy - IESVRA" }],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="bg-background text-foreground min-h-screen py-16">
      <div className="max-w-4xl mx-auto px-4 lg:px-8">
        <h1 className="font-display text-4xl text-navy-deep mb-8 font-semibold">Privacy Policy</h1>

        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <p>Last updated: June 1, 2026</p>

          <h2 className="text-xl text-navy-deep font-semibold mt-8 mb-4">1. Introduction</h2>
          <p>
            Welcome to IESVRA. We respect your privacy and are committed to protecting your
            personal data. This privacy policy will inform you as to how we look after your personal
            data when you visit our website (regardless of where you visit it from) and tell you
            about your privacy rights and how the law protects you.
          </p>

          <h2 className="text-xl text-navy-deep font-semibold mt-8 mb-4">
            2. The data we collect about you
          </h2>
          <p>
            Personal data, or personal information, means any information about an individual from
            which that person can be identified. We may collect, use, store and transfer different
            kinds of personal data about you which we have grouped together as follows:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Identity Data</strong> includes first name, last name, username or similar
              identifier.
            </li>
            <li>
              <strong>Contact Data</strong> includes billing address, delivery address, email
              address and telephone numbers.
            </li>
            <li>
              <strong>Financial Data</strong> includes payment card details.
            </li>
            <li>
              <strong>Transaction Data</strong> includes details about payments to and from you and
              other details of products you have purchased from us.
            </li>
          </ul>

          <h2 className="text-xl text-navy-deep font-semibold mt-8 mb-4">
            3. How we use your personal data
          </h2>
          <p>
            We will only use your personal data when the law allows us to. Most commonly, we will
            use your personal data in the following circumstances:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Where we need to perform the contract we are about to enter into or have entered into
              with you.
            </li>
            <li>
              Where it is necessary for our legitimate interests (or those of a third party) and
              your interests and fundamental rights do not override those interests.
            </li>
            <li>Where we need to comply with a legal obligation.</li>
          </ul>

          <h2 className="text-xl text-navy-deep font-semibold mt-8 mb-4">4. Data Security</h2>
          <p>
            We have put in place appropriate security measures to prevent your personal data from
            being accidentally lost, used or accessed in an unauthorised way, altered or disclosed.
            In addition, we limit access to your personal data to those employees, agents,
            contractors and other third parties who have a business need to know.
          </p>
        </div>
      </div>
    </div>
  );
}
