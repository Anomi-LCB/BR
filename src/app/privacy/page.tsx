
import React from 'react';

export default function PrivacyPolicy() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl prose dark:prose-invert">
            <h1>Privacy Policy</h1>
            <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

            <h2>1. Introduction</h2>
            <p>
                <strong>Bible 365</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy.
                This Privacy Policy explains how your personal information is collected, used, and disclosed by Bible 365.
            </p>

            <h2>2. Information We Collect</h2>
            <h3>2.1 Personal Data</h3>
            <p>
                When you log in using social authentication (e.g., Google, Kakao), we collect your email address and profile name
                solely for the purpose of user identification and account management via <strong>Supabase Auth</strong>.
            </p>

            <h3>2.2 Usage Data</h3>
            <p>
                We collect data related to your interaction with the app, such as:
            </p>
            <ul>
                <li>Bible reading progress (chapters read, streaks).</li>
                <li>Journal entries and prayer notes (stored securely in our database).</li>
                <li>App interactions (e.g., clicking on features) for analytics.</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>
                We use the collected data to:
            </p>
            <ul>
                <li>Provide and maintain the Service.</li>
                <li>Sync your reading progress across devices.</li>
                <li>Generate AI-based insights (e.g., Rhema AI context) based on your journal entries.</li>
                <li>Monitor the usage of the Service to detect, prevent and address technical issues.</li>
            </ul>

            <h2>4. Data Storage and Security</h2>
            <p>
                Your data is stored securely on <strong>Supabase</strong> (PostgreSQL).
                We implement industry-standard security measures to protect your data.
                However, please remember that no method of transmission over the Internet is 100% secure.
            </p>

            <h2>5. AI Features (Gemini)</h2>
            <p>
                Our creating uses Google&apos;s Gemini API to provide meditation summaries and prayer generation.
                Text data sent to the AI model is used solely for generating the response and is not used to train the public model.
            </p>

            <h2>6. Contact Us</h2>
            <p>
                If you have any questions about this Privacy Policy, please contact us at:
                <br />
                Email: support@bible365.app
            </p>
        </div>
    );
}
