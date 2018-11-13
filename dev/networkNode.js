const express = require('express');
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const uuid = require('uuid/v1');
const nodeAddress = uuid().split('-').join('');
const bitcoin = new Blockchain();
const port = process.argv[2];
const rp = require('request-promise');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extend: false}));


app.get('/', (req, res) => res.send('Hello World!'));

//get entire blockchain
app.get('/blockchain', function (req, res) {
   res.send(bitcoin);
});

//create new transaction
app.post('/transaction',function (req, res) {
    const blockIndex = bitcoin.createNewTransaction(req.body.amount,req.body.sender);
    res.json({note: `Transaction will be added in block ${blockIndex}`});
});

app.get('/mine',function (req,res) {
    const lastBlock = bitcoin.getLastBlock();
    const previousBlockHash = lastBlock['hash'];

    const currentBlockData = {
        transactions : bitcoin.pendingTransactions,
        index : lastBlock['index'] +1
    };
    const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
    const blockHash = bitcoin.hashBlock(previousBlockHash,currentBlockData, nonce);
    bitcoin.createNewTransaction(12.5,"00",nodeAddress);
    const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash,blockHash);

    res.json({
        note: "New block mined successfully",
        block: newBlock
    })
});

// register a node and broadcast it to to the network
app.post('/register-and-broadcast-node', function (req, res) {
    const newNodeUrl = req.body.newNodeUrl;
    if (bitcoin.networkNodes.indexOf(newNodeUrl) === -1 ) bitcoin.networkNodes.push(newNodeUrl)
    const regNodesPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        //register -node
        const requestOtions = {
            uri : networkNodeUrl + '/register-node',
            method : 'POST',
            body : {newNodeUrl : newNodeUrl},
            json : true,
        };
        regNodesPromises.push(requestOtions);
    });

    Promise.all(regNodesPromises).then(data => {
        const bulkRegistrationOptions = {
            uri: newNodeUrl + '/register-nodes-bulk',
            method: 'POST',
            body: {
                allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl]
            },
            json: true
        };

        return rp(bulkRegistrationOptions);
    }).then(data => {
        res.json({note : 'New Node registered with network successfully'});
    })
});
//register a node with the network
app.post('/register-node',function (req, res) {

});

//register multiple nodes at once
app.post('/register-nodes-bulk',function (req, res) {
    
});
app.listen(port, () => console.log(`Example app listening on port ${port}!`));