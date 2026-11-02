import fetch from 'node-fetch';

const CDP_URL = 'http://127.0.0.1:9230';

async function sendMessage() {
  try {
    // Lista abas
    console.log('📱 Listando abas...');
    let tabs = await (await fetch(`${CDP_URL}/json`)).json();
    console.log(`Total: ${tabs.length} abas`);
    
    // Procura Instagram ou cria nova
    let igTab = tabs.find(t => t.url.includes('instagram.com'));
    let tabId = igTab?.id;
    
    if (!igTab) {
      console.log('🔗 Navegando para Instagram DMs...');
      const resp = await fetch(`${CDP_URL}/json/new?url=https://www.instagram.com/direct/inbox/`);
      const newTab = await resp.json();
      tabId = newTab.id;
      await new Promise(r => setTimeout(r, 3000)); // aguarda carregamento
    } else {
      console.log(`✓ Instagram aba encontrada: ${igTab.title.slice(0, 40)}`);
    }
    
    // Conecta ao DevTools
    const wsURL = tabs.find(t => t.id === tabId)?.webSocketDebuggerUrl;
    if (!wsURL) {
      console.error('❌ Não achou WebSocket URL');
      process.exit(1);
    }
    
    console.log('🔌 Conectando CDP...');
    const ws = new (await import('ws')).default(wsURL);
    
    let msgId = 0;
    const send = (method, params = {}) => {
      return new Promise((resolve, reject) => {
        const id = ++msgId;
        ws.once('message', msg => {
          const data = JSON.parse(msg);
          if (data.id === id) {
            if (data.error) reject(data.error);
            else resolve(data.result);
          }
        });
        ws.send(JSON.stringify({ id, method, params }));
      });
    };
    
    // Aguarda navegação
    await new Promise(r => setTimeout(r, 2000));
    
    // Procura caixa de mensagem
    console.log('🔍 Localizando DM da Dora...');
    
    // Executa script para achar a última conversa
    const result = await send('Runtime.evaluate', {
      expression: `
        (() => {
          // Lista de conversas
          const convs = document.querySelectorAll('[role="listitem"]');
          if (convs.length === 0) return { error: 'Sem conversas encontradas' };
          
          // Clica na primeira (última não lida)
          convs[0].click();
          return { clicked: true, total: convs.length };
        })()
      `,
      returnByValue: true
    });
    
    console.log('📨 Resultado:', result);
    await new Promise(r => setTimeout(r, 1500));
    
    // Localiza input de mensagem
    console.log('✍️ Digitando mensagens...');
    const inputResult = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const input = document.querySelector('[aria-label*="Mensagem"]') || 
                        document.querySelector('textarea') ||
                        document.querySelector('[contenteditable="true"]');
          return { found: !!input, selector: input?.tagName };
        })()
      `,
      returnByValue: true
    });
    
    console.log('Input encontrado:', inputResult);
    
    // Clica no input
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const input = document.querySelector('[aria-label*="Mensagem"]') || 
                        document.querySelector('textarea') ||
                        document.querySelector('[contenteditable="true"]');
          if (input) input.focus();
          return !!input;
        })()
      `,
      returnByValue: true
    });
    
    // Digita primeira mensagem
    await send('Input.insertText', { text: 'Kkk pré verão é desculpa invented de novo' });
    await new Promise(r => setTimeout(r, 500));
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter' });
    await new Promise(r => setTimeout(r, 1000));
    
    // Segunda mensagem
    await send('Input.insertText', { text: 'Pode mandar sim' });
    await new Promise(r => setTimeout(r, 500));
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter' });
    
    console.log('✅ Mensagens enviadas!');
    ws.close();
    
  } catch (e) {
    console.error('❌ Erro:', e.message || e);
    process.exit(1);
  }
}

sendMessage();
