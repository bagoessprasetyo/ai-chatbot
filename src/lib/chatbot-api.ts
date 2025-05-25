import { apiRequest } from "./api-utils"

export class ChatbotAPI {
  static async fetchAll() {
    return apiRequest('/api/chatbots')
  }

  static async updateConfig(chatbotId: string, config: any, name?: string) {
    return apiRequest(`/api/chatbots/${chatbotId}/config`, {
      method: 'PUT',
      body: JSON.stringify({ config, name })
    })
  }

  static async updateStatus(chatbotId: string, isActive: boolean) {
    return apiRequest(`/api/chatbots/${chatbotId}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive })
    })
  }

  static async delete(chatbotId: string) {
    return apiRequest(`/api/chatbots/${chatbotId}`, {
      method: 'DELETE'
    })
  }

  static async getConfig(chatbotId: string) {
    return apiRequest(`/api/chatbots/${chatbotId}/config`)
  }
}