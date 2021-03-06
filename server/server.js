require('dotenv').config();
const http = require('http');
const { ApolloServer, PubSub } = require('apollo-server-express');
const express = require('express');
const jwt = require('jsonwebtoken');
const typeDefs = require('./schema') ;
const resolvers = require('./resolvers') ;
const pubSub = new PubSub();
const PORT = process.env.PORT || 5000;
const authKey = process.env.AUTH_SECRET || 'imNotAGood-AUTH_SECRET-Key';
const authKeyRf = process.env.AUTH_SECRET_RF || 'imNotAGood-AUTH_SECRET_RF-Key';
const isDev = process.env.ENV === 'development' ? true:false;
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, '../client/build')));


const server = new ApolloServer({
    typeDefs, 
    resolvers,
    context:(req,res) => ({
        req,
        res,
        pubSub,
        genToken: ({ userName, password }) => {

            const token = jwt.sign({ userName, password }, authKey, { expiresIn: '30d' });
            const rfToken = jwt.sign({ userName, password }, authKeyRf);
      
            return { token, rfToken }
          },
    }),
    introspection: isDev,
    playground: isDev
});

server.applyMiddleware({
    app,
    path:'/graphql'
})

const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);


app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

httpServer.listen(PORT, () => {
    console.log(`
    Server ready at http://localhost:${PORT}${server.graphqlPath}
    \n
    Subscriptions ready at ws://localhost:${PORT}${server.subscriptionsPath}
    `);
  })