const express = require('express');
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const uuid = require('uuid/v1');
const nodeAddress = uuid().split('-').join('');
const bitcoin = new Blockchain();
const port = process.argv[2];

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
app.listen(port, () => console.log(`Example app listening on port ${port}!`));