const ACCEPTED_DOMAINS = ['http://localhost:3000',
                          'http://localhost:3001',
                          'http://localhost:3002',
                          'http://localhost:3003',
                          'http://localhost:3004',
                          'http://localhost:3005',
                          'https://localhost:5000',
                          'http://localhost:5001',
                          'http://localhost:5002',
                          'http://localhost:5003',
                          'https://localhost:4200',
                          'https://localhost:5000',
                        ];

export default function authMiddleWare (req, res, next) {
    const origin = req.get('origin');

    if(ACCEPTED_DOMAINS.includes(origin)){
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Methods', '*');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.header('Access-Control-Allow-Credentials', true);
    }
    return next();

}
