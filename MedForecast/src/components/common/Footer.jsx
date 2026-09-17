import { Hospital } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-16 bg-white border-t border-gray-200 py-6">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Hospital className="w-6 h-6 text-blue-600 mr-2" />
            <span className="font-semibold text-gray-800">MedForecast</span>
          </div>
          <p className="text-sm text-gray-500">
            Built for Google Tech Sprint Hackathon 2024 • Saving Lives Through Technology
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="https://github.com/proxima-h/MedForecast" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
