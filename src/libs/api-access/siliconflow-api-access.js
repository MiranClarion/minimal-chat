import { showToast, parseStreamResponseChunk } from '../utils/general-utils';
import { updateUI } from '../utils/general-utils';
import { messages, streamedMessageText } from '../state-management/state';
import { addMessage } from '../conversation-management/message-processing';

// 用于存放推理内容的变量
export const reasoningContent = { value: '' };

/**
 * 从 SiliconFlow API 获取流式响应
 * @param {Array} conversation - 对话消息数组
 * @param {number} attitude - 温度参数
 * @param {string} model - 模型名称
 * @param {Function} updateUiFunction - 更新UI的函数
 * @param {AbortController} abortController - 中断控制器
 * @param {Object} streamedMessageTextParam - 流式消息文本参数
 * @param {boolean} autoScrollToBottom - 是否自动滚动到底部
 * @returns {Object} - 包含内容和推理结果的对象
 */
export async function fetchSiliconFlowResponseStream(
  conversation,
  attitude,
  model,
  updateUiFunction,
  abortController,
  streamedMessageTextParam,
  autoScrollToBottom = true
) {
  // 重置流式消息文本和推理内容
  streamedMessageText.value = '';
  reasoningContent.value = '';

  // 将对话消息转换为 API 需要的格式
  let tempMessages = conversation.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('siliconflowKey')}`,
    },
    body: JSON.stringify({
      model: model,
      stream: true,
      messages: tempMessages,
      temperature: attitude,
    }),
    signal: abortController.signal,
  };

  try {
    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', requestOptions);
    const result = await readSiliconFlowResponseStream(response, updateUiFunction, autoScrollToBottom);
    return result;
  } catch (error) {
    if (error.name === 'AbortError') {
      showToast('Stream Request Aborted.');
      return;
    }

    console.error('Error fetching SiliconFlow response:', error);
    showToast('Stream Request Failed.');
    return;
  }
}

/**
 * 读取 SiliconFlow API 的流式响应
 * @param {Response} response - API 响应对象
 * @param {Function} updateUiFunction - 更新UI的函数
 * @param {boolean} autoScrollToBottom - 是否自动滚动到底部
 * @returns {Object} - 包含内容和推理结果的对象
 */
async function readSiliconFlowResponseStream(response, updateUiFunction, autoScrollToBottom = true) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let decodedResult = '';
  let reasoningResult = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    // 处理 SSE 格式的数据
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.substring(6);
        if (data === '[DONE]') continue;

        try {
          const parsedData = JSON.parse(data);
          const delta = parsedData.choices[0].delta;

          // 处理推理内容
          if (delta.reasoning_content) {
            reasoningResult += delta.reasoning_content;
            reasoningContent.value = reasoningResult;
          }

          // 处理普通内容
          if (delta.content) {
            decodedResult += delta.content;
            updateUI(delta.content, messages.value, addMessage, autoScrollToBottom, true, reasoningResult);
          }
        } catch (e) {
          console.error('Error parsing SSE data:', e);
        }
      }
    }
  }

  return { content: decodedResult, reasoning: reasoningResult };
}

/**
 * 从 SiliconFlow API 获取对话标题
 * @param {Array} messages - 对话消息数组
 * @returns {string} - 对话标题
 */
export async function getConversationTitleFromSiliconFlow(messages) {
  try {
    // 将对话消息转换为 API 需要的格式
    let tempMessages = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    // 添加用户请求生成对话标题的消息
    tempMessages.push({
      role: 'user',
      content: 'Summarize our conversation in 5 words or less.'
    });

    const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('siliconflowKey')}`,
      },
      body: JSON.stringify({
        model: localStorage.getItem('siliconflowModelName') || 'deepseek-ai/DeepSeek-R1',
        messages: tempMessages,
        max_tokens: 18,
        temperature: 0.1,
      }),
    });

    const result = await response.json();

    // 返回生成的对话标题
    if (result.choices && result.choices.length > 0) {
      return result.choices[0].message.content;
    } else {
      return 'Generated Conversation';
    }
  } catch (error) {
    console.error('Error fetching SiliconFlow conversation title:', error);
    return 'SiliconFlow Conversation';
  }
}
