import React from 'react';
import BPMNViewer from './BPMNViewer';

const ProcessDetail = ({ process }) => {
  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-200">
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{process.process_name}</h3>
      <p className="text-gray-600 mb-6">{process.process_description}</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h4 className="text-xl font-semibold mb-3 text-gray-800">Process Map (BPMN)</h4>
          <BPMNViewer xml={process.process_map_bpmn_xml} />
        </div>
        
        <div className="space-y-6">
          <div>
              <h4 className="text-xl font-semibold mb-3 text-gray-800">Risk Taxonomy</h4>
              <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                          <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Name</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                          {process.risk_taxonomy.map((risk, idx) => (
                              <tr key={idx}>
                                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{risk.category}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{risk.risk_name}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
          <div>
              <h4 className="text-xl font-semibold mb-3 text-gray-800">Controls</h4>
              <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                       <thead className="bg-gray-50">
                          <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Control Name</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                          {process.controls.map((control, idx) => (
                              <tr key={idx}>
                                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">{control.control_name}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">{control.control_type}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessDetail;
