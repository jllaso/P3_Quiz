const {log, biglog, errorlog, colorize} = require("./out");

const Sequelize = require('sequelize');

const {models} = require('./model');



/*FUNCIONES DEL SWITCH/CASE"*/

exports.helpCmd = rl => {
		log("Comandos:");
  		log("  h|help - Muestra esta ayuda.");
  		log("  list - Listar los quizzes existentes.");
  		log("  show <id> - Muestra la pregunta y la respuesta el quiz indicado");
  		log("  add - Añadir un nuevo quiz interactivamente.");
  		log("  delete <id> - Borrar el quiz indicado.");
  		log("  test <id> - Probar el quiz indicado.");
  		log("  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
  		log("  q|quit - Salir del programa.");
  		rl.prompt();
}; 


exports.listCmd = rl =>
{

    /*model.getAll().forEach((quiz, id) => {

        log(`  [${colorize(id, 'magenta')}]: ${quiz.question} `);
        rl.prompt();
*/


    models.quiz.findAll()
        .each(quiz => {
        log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question}`); //id es el identificador del quiz en la base de datos
        })
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
    });

};


const validateId = id => {

    return new Sequelize.Promise((resolve, reject) => {  //creo una nueva promesa
        if (typeof id === "undefined") {  //veo si está o no indefinido
            reject(new Error(`El valor del parámetro id no es válido.`));
    } else {
            id = parseInt(id);
            if(Number.isNaN(id)) { //veo si no es un número
                rejects(new Error(`El valor del parámetro id no es un número.`));
            } else {
                resolve(id); //devuelve el id con el que quiero trabajar
            }
        }
    });
};
	



exports.showCmd = (rl,id) =>
{

   /* if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id. `);
    } else {

        try {
            const quiz = model.getByIndex(id);
            log(`[${colorize(id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        } catch (error) {
            errorlog(error.message);
        }


    }


	rl.prompt();
	*/
    validateId(id)
        .then(id => models.quiz.findById(id))
    .then(quiz => {
        if(!quiz) {
            throw new Error(`No existe un quiz asociado al id= ${id}.`);
        }
        log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
    });
};


const makeQuestion = (rl, text) => {

    return new Sequelize.Promise((resolve, reject) => {
        rl.question(colorize(text, 'red'), answer => {
            resolve(answer.trim());
        });
    });
};





exports.addCmd = rl => {
//OJO, Comportamiento asíncrono de la funcion question
    /*rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {

		rl.question(colorize(' Introduzca la respuesta ', 'red'), answer => {

        	model.add(question, answer);
    		log(`${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer}`);
    		rl.prompt();
		});
	});*/

    makeQuestion(rl, ' Introduzca una pregunta: ')
        .then(q => {
            return makeQuestion(rl, ' Introduzca la respuesta ')
                .then(a => {               //anidado para poder tener acceso aqui a q
                    return {question: q, answer:a};
            });
    })
    .then(quiz => {
        return models.quiz.create(quiz);
    })
    .then((quiz) => {
        log(`${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch(Sequelize.ValidationError, error => {
        errorlog('El quiz es erroneo:');
        error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
    });
};

exports.deleteCmd =  (rl,id) => {

  /*  if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id. `);
    } else {

        try {
        	model.deleteByIndex(id);
        } catch (error) {
            errorlog(error.message);
        }

    }

	rl.prompt();*/
    validateId(id)
        .then(id => models.quiz.destroy({ where: {id}}))
    .catch(error => {
        errorlog(error.message)
    })
    .then(() => {
        rl.prompt();
    });
};

exports.editCmd =  (rl,id) =>
{
    /* if (typeof id === "undefined") {
         errorlog(`Falta el parámetro id. `);
         rl.prompt();
     } else {
         try {
             const quiz = model.getByIndex(id);

             process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);

             rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {

                 process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);


                 rl.question(colorize('Introduzca la respuesta: ', 'red'), answer => {
                     model.update(id, question, answer);
                     log(`Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>', 'magenta')} ${answer}`);
                     rl.prompt();
                 });
             });





         } catch (error) {
             errorlog(error.message);
         }

     }*/

    validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
        if(!quiz){
            throw new Error(`No existe un quiz asociado al id=${id}.`);
    }

    process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);
        return makeQuestion(rl, ' Introduzca la pregunta: ')
        .then(q => {
            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);
            return makeQuestion(rl, ' Introduzca la respuesta ')
            .then(a => {
                quiz.question = q;
                quiz.answer = a;
                return quiz;
            });
        });

    })
    .then(quiz => {
      return quiz.save();  //Recibo el quiz cambiado y lo guardo en la base de datos
    })
    .then(quiz => {
         log(` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);

    })
    .catch(Sequelize.ValidationError, error => {
        errorlog('El quiz es erroneo:');
        error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
        errorlog(error.message);
    })
    .then(() => {
        rl.prompt();
    });
};

exports.testCmd =  (rl,id) =>
{

   /* if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id. `);
        rl.prompt();
    } else {
        try {
            const quiz = model.getByIndex(id);

            rl.question(colorize(quiz.question, 'red'), answer => {

				//answer= answer.toLowerCase().trim();

                if(answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim())
            {
                log(`Su respuesta es correcta.`);
                biglog('Correcta', 'green');
                rl.prompt();
            }
        else
            {
                log(`Su respuesta es incorrecta.`);
                biglog('Incorrecta', 'red');
                rl.prompt();
            }


        })
            ;
        } catch (error) {
            errorlog(error.message);
            rl.prompt();
        }


    }*/
    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
    if(!quiz){
        throw new Error(`No existe un quiz asociado al id=${id}.`);
    }
        return makeQuestion(rl, ` ${quiz.question}? `)

        .then(answer =>  {
        if(answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()){
            log(`Su respuesta es correcta.`);
            biglog('Correcta', 'green');
            return;
        }else{
            log(`Su respuesta es incorrecta.`);
            biglog('Incorrecta', 'red');
            return;
        }
        })
    })
    .catch(error => {
    errorlog(error.message);
    })
    .then(()=> {
        rl.prompt();
})

};




exports.playCmd = rl => {

	//número de aciertos


	/*for (i=0; i < max; i++) {

        toBeResolved[i]=i;

    }
*/

	/*

	const playOne = () => {

        if (toBeResolved.length === 0) {
            log(`No hay nada más que preguntar.`);
            log(`Fin del juego. Aciertos: ${score}`);
            biglog(score, 'magenta');
            rl.prompt();
        } else {

            let id = Math.floor(Math.random() * toBeResolved.length);
            let quiz = toBeResolved[id];
            toBeResolved.splice(id, 1);



                rl.question(colorize(quiz.question, 'red'), answer => {

                    if(answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim())
                {
                    score++;
                    log(`CORRECTO - Lleva ${score} aciertos.`);
                    playOne();
                }
            else
                {
                    log(`INCORRECTO.`);
                    log(`Fin del juego. Aciertos: ${score}`);
                    biglog(score, 'magenta');
                    rl.prompt();
                }
            });



        }
    }


    playOne();
    */


    let score = 0;
    let toBeResolved = [];

    /*models.quiz.findAll({raw: true})
        .then(quizzes => {
        toBeResolved=quizzes;
    })*/

    const playOne = () => {


        return Sequelize.Promise.resolve()
            .then(() => {
            if(toBeResolved.length <= 0){
            log(`No hay nada más que preguntar.`);
            log(`Fin del juego. Aciertos: ${score}`);
            biglog(`${score}`, 'blue');
            return;
        }


        let id = Math.floor(Math.random() * toBeResolved.length);
        let quiz = toBeResolved[id];
        toBeResolved.splice(id, 1);


        return makeQuestion(rl, `${quiz.question}? `)
            .then(answer => {
            if(answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim())
        {
            score++;
            log(`CORRECTO - Lleva ${score} aciertos.`, 'green');
            return playOne();
        }else{
            log(`INCORRECTO.`);
            log(`Fin del juego. Aciertos: ${score}`);
            biglog(`${score}`, 'blue');
            return;
        }
    })

    })};
    models.quiz.findAll({raw: true})
        .then(quizzes => {
        toBeResolved=quizzes;
    })
    .then(() => {

        return playOne();
    })
    .catch(error => {
        errorlog(`Error: ${error.message}`);
    })
    .then(() => {
        rl.prompt();
    });


	};

exports.creditsCmd = rl => {
		log('Autor de la práctica:');
  		log('JOSE LUIS LASO FERNANDEZ', 'green');
  		rl.prompt();

};

exports.quitCmd = rl => {
	rl.close();
};
