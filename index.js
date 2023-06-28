// Importar os módulos necessários
const http = require('http');
const dgram = require('dgram');
const url = require('url');
const querystring = require('querystring');

// Criar um servidor HTTP
const server = http.createServer((req, res) => {
  // Verificar se a requisição é do tipo POST e tem o caminho /wol
  if (req.method === 'POST' && req.url === '/wol') {
    // Obter os dados enviados no corpo da requisição
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      // Converter os dados em um objeto
      let data = querystring.parse(body);
      // Verificar se os dados contêm o endereço MAC do computador alvo
      console.log(body)
      if (data.mac) {
        // Criar um pacote mágico com o endereço MAC
        let mac = data.mac.split(':').map(hex => parseInt(hex, 16));
        let magicPacket = Buffer.alloc(6, 0xff);
        for (let i = 0; i < 16; i++) {
          magicPacket = Buffer.concat([magicPacket, Buffer.from(mac)]);
        }
        // Criar um socket UDP
        let client = dgram.createSocket('udp4');
        // Obter o IP do request
        let ip = req.socket.remoteAddress;
        // Enviar o pacote mágico para o IP do request na porta 9
        client.send(magicPacket, 9, ip, err => {
          // Tratar possíveis erros de envio
          if (err) {
            console.error(err);
            res.statusCode = 500;
            res.end('Internal server error');
          } else {
            console.log(`Sent magic packet to ${data.mac} at ${ip}`);
            res.statusCode = 200;
            res.end('OK');
          }
          // Fechar o socket
          client.close();
        });
      } else {
        // Responder com código de erro 400 se não houver endereço MAC nos dados
        res.statusCode = 400;
        res.end('Bad request');
      }
    });
  } else if (req.method === 'GET' && req.url === '/') {
    // Responder com o texto hello world se a requisição for do tipo GET e tiver o caminho /
    const data = {
      message: 'Hello',
      status: 200
    };    
    res.end(JSON.stringify(data));
  } else {
    // Responder com código de erro 404 se a requisição não for do tipo POST ou GET ou não tiver o caminho /wol ou /
    res.statusCode = 404;
    res.end('Not found');
  }
});

// Obter a porta do Heroku ou usar 3000 como padrão
const port = process.env.PORT || 3000;

// Fazer o servidor escutar na porta definida
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
