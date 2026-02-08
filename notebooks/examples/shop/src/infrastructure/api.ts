import * as http from 'http';
import { placeOrder } from '../application/place-order';
import { listProducts, searchProducts } from '../application/browse-catalog';
import { registerCustomer } from '../application/register-customer';
import { SqlOrderRepository } from './sql-order-repository';
import { InMemoryCatalog } from './in-memory-catalog';
import { EmailNotification } from './email-notification';

// Composition root — wire up adapters
const orderRepo = new SqlOrderRepository();
const catalog = new InMemoryCatalog();
const notifications = new EmailNotification();

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/products' && req.method === 'GET') {
    const products = listProducts(catalog);
    res.end(JSON.stringify(products));
    return;
  }

  if (req.url?.startsWith('/products/search') && req.method === 'GET') {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const query = url.searchParams.get('q') ?? '';
    const results = searchProducts(query, catalog);
    res.end(JSON.stringify(results));
    return;
  }

  if (req.url === '/orders' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const request = JSON.parse(body);
        const order = placeOrder(request, orderRepo, catalog, notifications);
        res.statusCode = 201;
        res.end(JSON.stringify(order));
      } catch (err) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: (err as Error).message }));
      }
    });
    return;
  }

  if (req.url === '/customers' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { id, name, email } = JSON.parse(body);
        const customer = registerCustomer(id, name, email, notifications);
        res.statusCode = 201;
        res.end(JSON.stringify(customer));
      } catch (err) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: (err as Error).message }));
      }
    });
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'Not found' }));
});

const PORT = process.env.PORT ?? 3000;
server.listen(PORT, () => {
  console.log(`Shop API listening on http://localhost:${PORT}`);
});
