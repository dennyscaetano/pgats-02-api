// Importamos o "supertest", uma biblioteca que ajuda a testar requisições HTTP (APIs)
const request = require('supertest');

// Importamos "expect" da biblioteca "chai" para fazer validações (asserts)
const { expect } = require('chai'); 

// Criamos um grupo de testes usando describe()
// Aqui o foco é validar a mutation de transferência da API GraphQL
describe('Graphql API - Transfer Mutation - External', () => {
    let token; // Variável que vai armazenar o token de autenticação
    let baseUrl = 'http://localhost:4000'; // Endereço da API que será testada

    // O bloco "beforeEach" roda antes de cada teste (it)
    // Aqui usamos ele para fazer login e pegar um token válido
    beforeEach(async () => {
        // Definição da mutation de login em formato GraphQL
        const loginMutation = `mutation LoginUser($username: String!, $password: String!) {
            loginUser(username: $username, password: $password) {
                token
            }
        }`;

        // Variáveis que serão passadas para a mutation de login
        const loginVariables = {
            username: "julio", 
            password: "123456"
        };

        // Fazemos a requisição de login para a API
        const respostaLogin = await request(baseUrl)
            .post('/graphql')
            .send({
                query: loginMutation,
                variables: loginVariables
            });
        
        // Salvamos o token para ser usado nos testes seguintes
        token = respostaLogin.body.data.loginUser.token;
        //console.log(token) // Caso queira debugar o token
    });
    
    
    // Primeiro teste: validar sucesso ao realizar transferência com valores válidos
    it('Ao informar valores válidos tenho sucesso e status code 200', async () => {
        // Faz a requisição para criar a transferência
        const resposta = await request(baseUrl) 
            .post('/graphql')
            .set('Authorization', `Bearer ${token}`) // enviamos o token no header
            .send({ 
                query: `mutation CreateTransfer($from: String!, $value: Float!, $to: String!) {
                        createTransfer(from: $from, value: $value, to: $to) {
                            from
                            to
                            value
                        }
                }`,
                variables: {
                    from: "julio",
                    to: "priscila",
                    value: 10
                }
            })

        // Valida que o status HTTP da resposta foi 200
        expect(resposta.status).to.equal(200)

        // Importa a resposta esperada de um arquivo fixture (boa prática para manter previsibilidade dos testes)
        const respostaEsperada = require('../fixture/respostas/quandoInformoValoresValidosNoMutationReceboStatusCode200.json')

        // Valida que a resposta recebida da API é exatamente igual ao que esperávamos
        expect(resposta.body).to.deep.equal(respostaEsperada);
    });

    // Segundo teste: validar mensagem de erro quando o valor transferido é maior que o saldo disponível
    it('Transferência de valores superiores ao saldo, logo tenho mensagem de Saldo Insuficiente.', async () => {
        const resposta = await request(baseUrl) 
            .post('/graphql')
            .set('Authorization', `Bearer ${token}`)
            .send({ 
                query: `mutation CreateTransfer($from: String!, $value: Float!, $to: String!) {
                        createTransfer(from: $from, value: $value, to: $to) {
                            from
                            to
                            value
                        }
                }`,
                variables: {
                    from: "julio",
                    to: "priscila",
                    value: 999999 // valor propositalmente maior que o saldo
                }
            })

        expect(resposta.status).to.equal(200)

        // Aqui verificamos se a mensagem de erro retornada corresponde ao esperado
        expect(resposta.body).to.have.nested.property('errors[0].message', 'Saldo insuficiente')
    });

    // Terceiro teste: validar mensagem de erro quando não enviamos o token de autenticação
    it('Se eu não informar um token recebo a mensagem de Autenticação obrigatória', async () => {
        const resposta = await request(baseUrl) 
            .post('/graphql')
            //.set('Authorization', `Bearer ${token}`) // token não enviado de propósito
            .send({ 
                query: `mutation CreateTransfer($from: String!, $value: Float!, $to: String!) {
                        createTransfer(from: $from, value: $value, to: $to) {
                            from
                            to
                            value
                        }
                }`,
                variables: {
                    from: "julio",
                    to: "priscila",
                    value: 28
                }
            })

        expect(resposta.status).to.equal(200)

        // Validamos se a mensagem de erro corresponde ao esperado
        expect(resposta.body).to.have.nested.property('errors[0].message', 'Autenticação obrigatória')
    });
});
