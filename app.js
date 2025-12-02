const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const server = express();
const { readFile } = require('fs').promises;
const ejs = require('ejs');
const { pipeline } = require('stream');
const { type } = require('os');

require('dotenv').config();

const port = 8080;
const client = new MongoClient(process.env.URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
const dataBaseName = "BD2";
const collectionName = "magia";


server.set('view engine', 'ejs');

server.use(express.static('public'));

server.use(express.json())

server.get('/', async (request, response) => {
    response.send(await readFile('Busca.html', 'utf8'));
});

server.get('/insere.html', async (request, response) => {
    response.send(await readFile('Insere.html', 'utf8'));
});

server.post('/buscar-magias', async (req, res) => {
    const { nome_magia, nivel_inferior, nivel_superior, crencas, formas_de_combate } = req.body;
    pipeline_stages = [{
        $match:
        {
            $expr:
            {
                $and: [{ $lte: ["$nivel_base", parseInt(nivel_superior)] }, { $gte: ["$nivel_base", parseInt(nivel_inferior)] }]
            }
        }
    }]
    if (crencas && crencas.length > 0) {
        //const placeholders = crencas.map((_, i) => `$${index++}`).join(', ');
        pipeline_stages.push({
            $lookup:
            {
                from: "crenca",
                localField: "crenca_x_magias.id_crenca",
                foreignField: "id",
                as: "id_mc"
            }
        })
        pipeline_stages.push({ $match: { "id_mc.nome": { $in: crencas } } });

        //params.push(...crencas);
    }


    if (formas_de_combate && formas_de_combate.length > 0) {
        //const placeholders = crencas.map((_, i) => `$${index++}`).join(', ');
        pipeline_stages.push({
            $lookup:
            {
                from: "forma_de_combate",
                localField: "forma_de_combate_x_magias.id_forma_de_combate",
                foreignField: "id",
                as: "id_mf"
            }
        })
        pipeline_stages.push({ $match: { "id_mf.nome": { $in: formas_de_combate } } });
    }

    if (nome_magia) {
        pipeline_stages.push({
            $match: {
                nome: { $regex: nome_magia, $options: "i" }
            }
        }
        )
    }
    try {

        const result = await client.db(dataBaseName).collection(collectionName).aggregate(pipeline_stages).toArray();
        res.json(result)
    } catch (err) {
        console.error('Erro ao buscar magias:', err);
        res.status(500).json({ erro: 'Erro no servidor' });
    }
});


server.post('/inserir-magias', async (req, res) => {
    const { nivel_magia, nome_magia, crenca1, crenca2, forma1, forma2, custo_inicial, custo_rodada, custo_acao, escalonamento, descricao } = req.body;
    console.log(typeof(nivel_magia))
    const queryNomeMag = {
        nome: nome_magia
    };

    const projectionNomeMag = {
        _id: 0,
        nome: 1
    };
    const resultNomeMag = await client.db(dataBaseName).collection("counters").findOne(queryNomeMag, projectionNomeMag);

    const session = client.startSession();
    try {
        if (nome_magia === null){
            throw Error("Nome obrigatório")
        }
        if (resultNomeMag?.nome === nome_magia) {
            throw Error("Magia com nome " + nome_magia + ' já existe')
        }
        const transactionResults = await session.withTransaction(async () => {
            const seqIdName = "mag_id"; // O nome ou _id do documento contador

            const querySeq = { _id: seqIdName };

            const updateSeq = { $inc: { seq: 1 } };

            const optionsSeq = {
                returnDocument: "after",
                upsert: true
            };
            //Isso é para referenciar o counter da coleção "magia" ou da "counters?"
            const resultSeq = await client.db(dataBaseName).collection(collectionName).findOneAndUpdate(querySeq, updateSeq, optionsSeq);
            console.log(resultSeq)
            const novoIdMag = resultSeq.seq;

            const queryCrenca = {
                $or: [{ nome: crenca1 }, { nome: crenca2 }]
            };

            const projectionCrenca = {
                _id: 0,
                id: 1
            };
            
            const resultCrenca = await client.db(dataBaseName).collection("crenca").find(queryCrenca, projectionCrenca).toArray();
            const idCrenca1 = resultCrenca[0].id;
            const idCrenca2 = resultCrenca[1].id;


            const queryForma = {
                $or: [{ nome: forma1 }, { nome: forma2 }]
            };

            const projectionForma = {
                _id: 0,
                id: 1
            };

            const resultForma = await client.db(dataBaseName).collection("forma_de_combate").find(queryForma, projectionForma).toArray();
            const idForma1 = resultForma[0].id;
            const idForma2 = resultForma[1].id;

            //obter id de crenca e forma de combate, alem do novo id magia

            const newInsert = ({
                id: novoIdMag,
                nome: nome_magia,
                custo_inicial: parseInt(custo_inicial),
                custo_por_rodada: parseInt(custo_rodada),
                nivel_base: parseInt(nivel_magia),
                descricao: descricao,
                custo_acao: custo_acao,
                escalonamento: escalonamento,
                crenca_x_magias: [
                    { id_crenca: idCrenca1 },
                    { id_crenca: idCrenca2 }
                ],
                forma_de_combate_x_magias: [
                    { id_forma_de_combate: idForma1 },
                    { id_forma_de_combate: idForma2 }
                ]
            })

            const resultInsert = await client.db(dataBaseName).collection(collectionName).insertOne(newInsert);
        })



    } catch (e) {

        console.log("Erro na inserção")
        res.status(500).json({ erro: e.message });
    } finally {
        session.endSession()
    }
});


server.get('/magias/:nome', async (request, response) => {
    const upperName = String(request.params.nome);
    try {
        const magia_result = await client.db(dataBaseName).collection("magia").findOne({ nome: upperName });
        console.log(magia_result)
        const crencas_result = await client.db(dataBaseName).collection("magia").aggregate([
            { $match: { "nome": upperName } },
            {
                $lookup: {
                    from: "crenca",
                    localField: "crenca_x_magias.id_crenca",
                    foreignField: "id",
                    as: "crencas"
                }
            },
            { $project: { "crencas": "$crencas.nome" } }]).toArray()
        // Busca formas de combate associadas
        const formas_de_combate_result = await client.db(dataBaseName).collection("magia").aggregate([
            { $match: { "nome": upperName } },
            {
                $lookup: {
                    from: "forma_de_combate",
                    localField: "forma_de_combate_x_magias.id_forma_de_combate",
                    foreignField: "id",
                    as: "forma_de_combate"
                }
            },
            { $project: { "formas_de_combate": "$forma_de_combate.nome" } }]).toArray()

        const magia = magia_result
        const crencas = crencas_result[0].crencas
        const formas_de_combate = formas_de_combate_result[0].formas_de_combate

        response.render('Magia.ejs', { magia, crencas, formas_de_combate });
    } catch (err) {
        console.error('Database error:', err);
        response.status(500).send('Internal server error');
        response.status(500).json({ erro: 'Erro no servidor' });
    }
});

server.listen(process.env.PORT || port, () => console.log(`App available on http://localhost:${port}`));
