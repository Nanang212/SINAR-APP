<script lang="ts">
  import { DashboardLayout } from "$lib";

  let activeTab = $state("input");

  function setActiveTab(tab: string) {
    activeTab = tab;
  }
</script>

<DashboardLayout>
  <div class="h-full flex flex-col">
    <!-- Sticky Header and Tabs -->
    <div class="sticky top-0 bg-gradient-to-br from-slate-50 to-blue-50 z-20 pb-6">
      <!-- Page Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Master Dokumen</h1>
        <p class="text-gray-600 mt-1">Manage and browse documents</p>
      </div>

      <!-- Tab Navigation -->
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8">
        <button
          onclick={() => setActiveTab("input")}
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 {activeTab === 'input'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        >
          <div class="flex items-center space-x-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
            </svg>
            <span>Input</span>
          </div>
        </button>
        
        <button
          onclick={() => setActiveTab("browse")}
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 {activeTab === 'browse'
            ? 'border-blue-500 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
        >
          <div class="flex items-center space-x-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z"/>
            </svg>
            <span>Browse</span>
          </div>
        </button>
        </nav>
      </div>
    </div>

    <!-- Scrollable Tab Content -->
    <div class="flex-1 overflow-auto">
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      {#if activeTab === "input"}
        <!-- Input Form Tab -->
        <div class="p-6">
          <div class="max-w-2xl">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Add New Document</h2>
            
            <form class="space-y-6">
              <!-- Document Title -->
              <div>
                <label for="title" class="block text-sm font-medium text-gray-700 mb-2">
                  Document Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter document title"
                />
              </div>

              <!-- Description -->
              <div>
                <label for="description" class="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows="4"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter document description"
                ></textarea>
              </div>

              <!-- Category -->
              <div>
                <label for="category" class="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select category</option>
                  <option value="1">Policy</option>
                  <option value="2">Procedure</option>
                  <option value="3">Manual</option>
                  <option value="4">Form</option>
                </select>
              </div>

              <!-- File Upload -->
              <div>
                <label for="file" class="block text-sm font-medium text-gray-700 mb-2">
                  Document File *
                </label>
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <p class="mt-2 text-sm text-gray-600">
                    <span class="font-medium text-blue-600 hover:text-blue-500 cursor-pointer">
                      Click to upload
                    </span>
                    or drag and drop
                  </p>
                  <p class="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
                  <input type="file" id="file" name="file" class="hidden" accept=".pdf,.doc,.docx" />
                </div>
              </div>

              <!-- Document Number -->
              <div>
                <label for="doc_number" class="block text-sm font-medium text-gray-700 mb-2">
                  Document Number *
                </label>
                <input
                  type="text"
                  id="doc_number"
                  name="doc_number"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., DOC-2024-001"
                />
              </div>

              <!-- Version -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="version" class="block text-sm font-medium text-gray-700 mb-2">
                    Version
                  </label>
                  <input
                    type="text"
                    id="version"
                    name="version"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="1.0"
                  />
                </div>
                <div>
                  <label for="effective_date" class="block text-sm font-medium text-gray-700 mb-2">
                    Effective Date
                  </label>
                  <input
                    type="date"
                    id="effective_date"
                    name="effective_date"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <!-- Department and Created By -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="department" class="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <select
                    id="department"
                    name="department"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select department</option>
                    <option value="hr">Human Resources</option>
                    <option value="finance">Finance</option>
                    <option value="it">Information Technology</option>
                    <option value="operations">Operations</option>
                    <option value="legal">Legal</option>
                    <option value="marketing">Marketing</option>
                  </select>
                </div>
                <div>
                  <label for="created_by" class="block text-sm font-medium text-gray-700 mb-2">
                    Created By
                  </label>
                  <input
                    type="text"
                    id="created_by"
                    name="created_by"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Author name"
                  />
                </div>
              </div>

              <!-- Priority and Confidentiality -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="priority" class="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium" selected>Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label for="confidentiality" class="block text-sm font-medium text-gray-700 mb-2">
                    Confidentiality Level
                  </label>
                  <select
                    id="confidentiality"
                    name="confidentiality"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="public">Public</option>
                    <option value="internal" selected>Internal</option>
                    <option value="confidential">Confidential</option>
                    <option value="restricted">Restricted</option>
                  </select>
                </div>
              </div>

              <!-- Tags -->
              <div>
                <label for="tags" class="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter tags separated by commas (e.g., policy, hr, guidelines)"
                />
                <p class="text-xs text-gray-500 mt-1">Separate multiple tags with commas</p>
              </div>

              <!-- Review Schedule -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="review_date" class="block text-sm font-medium text-gray-700 mb-2">
                    Next Review Date
                  </label>
                  <input
                    type="date"
                    id="review_date"
                    name="review_date"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label for="retention_period" class="block text-sm font-medium text-gray-700 mb-2">
                    Retention Period (years)
                  </label>
                  <input
                    type="number"
                    id="retention_period"
                    name="retention_period"
                    min="1"
                    max="50"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="7"
                  />
                </div>
              </div>

              <!-- Related Documents -->
              <div>
                <label for="related_docs" class="block text-sm font-medium text-gray-700 mb-2">
                  Related Documents
                </label>
                <textarea
                  id="related_docs"
                  name="related_docs"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="List any related documents or references"
                ></textarea>
              </div>

              <!-- Approval Workflow -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-3">
                  Approval Required
                </label>
                <div class="space-y-2">
                  <label class="flex items-center">
                    <input type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span class="ml-2 text-sm text-gray-700">Requires manager approval</span>
                  </label>
                  <label class="flex items-center">
                    <input type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span class="ml-2 text-sm text-gray-700">Requires legal review</span>
                  </label>
                  <label class="flex items-center">
                    <input type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span class="ml-2 text-sm text-gray-700">Requires compliance approval</span>
                  </label>
                </div>
              </div>

              <!-- Status -->
              <div>
                <label for="status" class="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft" selected>Draft</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <!-- Comments -->
              <div>
                <label for="comments" class="block text-sm font-medium text-gray-700 mb-2">
                  Additional Comments
                </label>
                <textarea
                  id="comments"
                  name="comments"
                  rows="4"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any additional notes or comments about this document"
                ></textarea>
              </div>

              <!-- Form Actions -->
              <div class="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-md transition-colors duration-200"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-md transition-colors duration-200"
                >
                  Save Document
                </button>
              </div>
            </form>
          </div>
        </div>
      {:else if activeTab === "browse"}
        <!-- Browse/Table Tab -->
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Document List</h2>
            
            <!-- Search and Filter -->
            <div class="flex items-center space-x-4">
              <div class="relative">
                <input
                  type="text"
                  placeholder="Search documents..."
                  class="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              
              <select class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">All Categories</option>
                <option value="1">Policy</option>
                <option value="2">Procedure</option>
                <option value="3">Manual</option>
                <option value="4">Form</option>
              </select>
            </div>
          </div>

          <!-- Data Table -->
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <!-- Sample Data Row 1 -->
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <svg class="h-8 w-8 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clip-rule="evenodd"/>
                      </svg>
                      <div>
                        <div class="text-sm font-medium text-gray-900">Company Policy 2024</div>
                        <div class="text-sm text-gray-500">policy-2024.pdf</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Policy
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Jan 15, 2024
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex items-center space-x-2">
                      <button class="text-blue-600 hover:text-blue-900">View</button>
                      <button class="text-yellow-600 hover:text-yellow-900">Edit</button>
                      <button class="text-red-600 hover:text-red-900">Delete</button>
                    </div>
                  </td>
                </tr>

                <!-- Sample Data Row 2 -->
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <svg class="h-8 w-8 text-blue-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clip-rule="evenodd"/>
                      </svg>
                      <div>
                        <div class="text-sm font-medium text-gray-900">User Manual System</div>
                        <div class="text-sm text-gray-500">user-manual.docx</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Manual
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Draft
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Jan 10, 2024
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex items-center space-x-2">
                      <button class="text-blue-600 hover:text-blue-900">View</button>
                      <button class="text-yellow-600 hover:text-yellow-900">Edit</button>
                      <button class="text-red-600 hover:text-red-900">Delete</button>
                    </div>
                  </td>
                </tr>

                <!-- Sample Data Row 3 -->
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <svg class="h-8 w-8 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clip-rule="evenodd"/>
                      </svg>
                      <div>
                        <div class="text-sm font-medium text-gray-900">Standard Operating Procedure</div>
                        <div class="text-sm text-gray-500">sop-2024.pdf</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Procedure
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Jan 5, 2024
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex items-center space-x-2">
                      <button class="text-blue-600 hover:text-blue-900">View</button>
                      <button class="text-yellow-600 hover:text-yellow-900">Edit</button>
                      <button class="text-red-600 hover:text-red-900">Delete</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex items-center justify-between mt-6">
            <div class="text-sm text-gray-700">
              Showing <span class="font-medium">1</span> to <span class="font-medium">3</span> of <span class="font-medium">3</span> results
            </div>
            <div class="flex items-center space-x-2">
              <button class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                Previous
              </button>
              <button class="px-3 py-1 text-sm text-white bg-blue-600 border border-blue-600 rounded-md">
                1
              </button>
              <button class="px-3 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                Next
              </button>
            </div>
          </div>
        </div>
      {/if}
      </div>
    </div>
  </div>
</DashboardLayout>