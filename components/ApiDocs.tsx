import React, { useState } from 'react';
import { ArrowLeft, Zap, Code, Link as LinkIcon, Webhook, Copy, Check, Terminal, Globe } from 'lucide-react';
import Footer from './Footer';

interface ApiDocsProps {
  onBack: () => void;
}

const ApiDocs: React.FC<ApiDocsProps> = ({ onBack }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const baseUrl = window.location.origin;

  return (
    <div className="h-screen bg-slate-950 text-slate-100 font-sans selection:bg-brand-500 selection:text-white overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-bold text-lg flex items-center gap-2">
              <Code className="w-5 h-5 text-brand-500" />
              Developer API
            </h1>
          </div>
          <div className="text-xs font-mono text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            v1.0.0
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        
        {/* Intro */}
        <section className="space-y-6">
          <h2 className="text-4xl font-bold text-white">Browser-based Automation</h2>
          <p className="text-lg text-slate-400 max-w-3xl leading-relaxed">
            Podvibe exposes a URL-based API that allows you to trigger podcast generation programmatically from tools like 
            <span className="text-brand-400 font-medium"> n8n</span>, 
            <span className="text-brand-400 font-medium"> Zapier</span>, or your own scripts. 
            Because Podvibe runs entirely in the browser using your Gemini API key, the automation works by opening a specific URL which triggers the generation process client-side.
          </p>
          
          <div className="bg-brand-900/10 border border-brand-500/20 rounded-xl p-6 flex items-start gap-4">
            <Zap className="w-6 h-6 text-brand-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-brand-200 font-semibold mb-2">How it works</h3>
              <p className="text-sm text-brand-200/70 leading-relaxed">
                You construct a URL with your parameters. When your browser (or a headless browser) visits this URL, the app initializes, reads the parameters, generates the audio using your local API key, and can optionally POST the result to a webhook of your choice.
              </p>
            </div>
          </div>
        </section>

        {/* URL Structure */}
        <section className="space-y-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <Globe className="w-6 h-6 text-brand-500" />
            URL Structure
          </h3>
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Base Endpoint</span>
              <button 
                onClick={() => copyToClipboard(`${baseUrl}/?auto=true&key=YOUR_KEY&text=YOUR_CONTENT`, 'url')}
                className="text-xs flex items-center gap-1 text-brand-400 hover:text-brand-300"
              >
                {copiedSection === 'url' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedSection === 'url' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="p-4 font-mono text-sm text-brand-300 break-all">
              {baseUrl}/?auto=true&key=<span className="text-emerald-400">{`{API_KEY}`}</span>&text=<span className="text-emerald-400">{`{CONTENT}`}</span>
            </div>
          </div>
        </section>

        {/* Parameters */}
        <section className="space-y-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <Terminal className="w-6 h-6 text-brand-500" />
            Query Parameters
          </h3>
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-xs uppercase text-slate-500 font-semibold">
                  <th className="px-6 py-4">Parameter</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Required</th>
                  <th className="px-6 py-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                <tr>
                  <td className="px-6 py-4 font-mono text-brand-400">auto</td>
                  <td className="px-6 py-4 text-slate-400">boolean</td>
                  <td className="px-6 py-4 text-emerald-500 font-medium">Yes</td>
                  <td className="px-6 py-4 text-slate-300">Must be set to <code className="bg-slate-800 px-1 py-0.5 rounded text-xs">true</code> to trigger automatic generation.</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-mono text-brand-400">key</td>
                  <td className="px-6 py-4 text-slate-400">string</td>
                  <td className="px-6 py-4 text-emerald-500 font-medium">Yes*</td>
                  <td className="px-6 py-4 text-slate-300">Your Gemini API Key. <br/><span className="text-xs text-slate-500">*Not required if key is already saved in browser localStorage.</span></td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-mono text-brand-400">text / url</td>
                  <td className="px-6 py-4 text-slate-400">string</td>
                  <td className="px-6 py-4 text-emerald-500 font-medium">Yes</td>
                  <td className="px-6 py-4 text-slate-300">The source content (raw text) or a URL to an article/post. URL encoded.</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-mono text-brand-400">webhook</td>
                  <td className="px-6 py-4 text-slate-400">string</td>
                  <td className="px-6 py-4 text-slate-500">Optional</td>
                  <td className="px-6 py-4 text-slate-300">A URL where Podvibe will POST the generated JSON result (including audio).</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-mono text-brand-400">lang</td>
                  <td className="px-6 py-4 text-slate-400">string</td>
                  <td className="px-6 py-4 text-slate-500">Optional</td>
                  <td className="px-6 py-4 text-slate-300">
                    Language code. Options: <code className="bg-slate-800 px-1 py-0.5 rounded text-xs">English</code>, <code className="bg-slate-800 px-1 py-0.5 rounded text-xs">French</code>, <code className="bg-slate-800 px-1 py-0.5 rounded text-xs">FrenchCA</code>, <code className="bg-slate-800 px-1 py-0.5 rounded text-xs">Darija</code>, <code className="bg-slate-800 px-1 py-0.5 rounded text-xs">Arabic</code>, <code className="bg-slate-800 px-1 py-0.5 rounded text-xs">Spanish</code>, <code className="bg-slate-800 px-1 py-0.5 rounded text-xs">Chinese</code>.
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-mono text-brand-400">length</td>
                  <td className="px-6 py-4 text-slate-400">string</td>
                  <td className="px-6 py-4 text-slate-500">Optional</td>
                  <td className="px-6 py-4 text-slate-300">Duration preference. Options: <code className="bg-slate-800 px-1 py-0.5 rounded text-xs">Short</code>, <code className="bg-slate-800 px-1 py-0.5 rounded text-xs">Medium</code>, <code className="bg-slate-800 px-1 py-0.5 rounded text-xs">Long</code>.</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-mono text-brand-400">title</td>
                  <td className="px-6 py-4 text-slate-400">string</td>
                  <td className="px-6 py-4 text-slate-500">Optional</td>
                  <td className="px-6 py-4 text-slate-300">Force a specific title for the podcast episode.</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-mono text-brand-400">description</td>
                  <td className="px-6 py-4 text-slate-400">string</td>
                  <td className="px-6 py-4 text-slate-500">Optional</td>
                  <td className="px-6 py-4 text-slate-300">Custom instructions for the AI (e.g. "Make it funny", "Focus on technical details").</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-mono text-brand-400">host1 / host2</td>
                  <td className="px-6 py-4 text-slate-400">string</td>
                  <td className="px-6 py-4 text-slate-500">Optional</td>
                  <td className="px-6 py-4 text-slate-300">Custom names for the speakers.</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 font-mono text-brand-400">host1Voice / host2Voice</td>
                  <td className="px-6 py-4 text-slate-400">string</td>
                  <td className="px-6 py-4 text-slate-500">Optional</td>
                  <td className="px-6 py-4 text-slate-300">
                    Voice selection. Options: <code className="bg-slate-800 px-1 py-0.5 rounded text-xs">Puck</code>, <code className="bg-slate-800 px-1 py-0.5 rounded text-xs">Charon</code>, <code className="bg-slate-800 px-1 py-0.5 rounded text-xs">Fenrir</code>, <code className="bg-slate-800 px-1 py-0.5 rounded text-xs">Kore</code>, <code className="bg-slate-800 px-1 py-0.5 rounded text-xs">Zephyr</code>.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Webhook Response */}
        <section className="space-y-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <Webhook className="w-6 h-6 text-brand-500" />
            Webhook Payload
          </h3>
          <p className="text-slate-400">
            If a <code className="bg-slate-900 px-1.5 py-0.5 rounded text-brand-300 font-mono text-sm">webhook</code> URL is provided, Podvibe will send a POST request with the following JSON body once generation is complete.
          </p>
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden relative group">
             <div className="absolute right-4 top-4">
               <button 
                  onClick={() => copyToClipboard(`{
  "title": "My Generated Podcast",
  "script": "Host 1: Hello world...",
  "duration": 125.5,
  "audioBase64": "UklGRi..."
}`, 'json')}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  {copiedSection === 'json' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
               </button>
             </div>
             <pre className="p-6 text-sm font-mono text-slate-300 overflow-x-auto">
{`{
  "title": "My Generated Podcast",
  "script": "Host 1: Hello world...\\nHost 2: This is amazing...",
  "duration": 125.5,
  "audioBase64": "UklGRi..." // Base64 encoded WAV file
}`}
             </pre>
          </div>
        </section>

        {/* Example: n8n */}
        <section className="space-y-6">
          <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <LinkIcon className="w-6 h-6 text-brand-500" />
            Integration Example: n8n
          </h3>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
             <ol className="list-decimal list-inside space-y-3 text-slate-300 marker:text-brand-500">
                <li>Create a <strong>Webhook</strong> node in n8n (POST method) to receive the audio. Copy its URL.</li>
                <li>Add a function/node to construct the Podvibe URL with your params and the webhook URL.</li>
                <li>
                  Use a headless browser node (like <strong>Puppeteer</strong> or similar) or simply open the link in a browser tab to trigger the process.
                  <div className="mt-2 text-xs text-slate-500 bg-black/20 p-2 rounded">
                    Note: Since Podvibe requires a browser environment to run the Web Audio API and Gemini SDK, you cannot simply use a GET request. The page must be rendered.
                  </div>
                </li>
                <li>The n8n Webhook node will receive the JSON with the <code className="font-mono text-brand-300">audioBase64</code> field.</li>
                <li>Add a <strong>Binary</strong> node to convert the base64 string back to a binary file for upload/storage.</li>
             </ol>
          </div>
        </section>

      </div>
      
      <Footer onOpenApiDocs={() => {}} />
    </div>
  );
};

export default ApiDocs;