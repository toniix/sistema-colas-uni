-- USE SistemasColasUni; -- Omitir en Azure SQL Database ya que no soporta la sentencia USE

SET NOCOUNT ON;
INSERT INTO users(username,password,email,full_name,role,enabled,created_at) VALUES
('admin1','hash','admin1@unica.edu.pe','Administrador Uno','ADMIN',1,GETDATE()),
('admin2','hash','admin2@unica.edu.pe','Administrador Dos','ADMIN',1,GETDATE()),
('oper1','hash','oper1@unica.edu.pe','Operador 1','OPERATOR',1,GETDATE()),
('oper2','hash','oper2@unica.edu.pe','Operador 2','OPERATOR',1,GETDATE()),
('oper3','hash','oper3@unica.edu.pe','Operador 3','OPERATOR',1,GETDATE()),
('oper4','hash','oper4@unica.edu.pe','Operador 4','OPERATOR',1,GETDATE()),
('oper5','hash','oper5@unica.edu.pe','Operador 5','OPERATOR',1,GETDATE()),
('oper6','hash','oper6@unica.edu.pe','Operador 6','OPERATOR',1,GETDATE());
INSERT INTO users(username,password,email,full_name,role,enabled,created_at) VALUES('stud1','hash','stud1@unica.edu.pe','Estudiante 1','STUDENT',1,GETDATE());
INSERT INTO users(username,password,email,full_name,role,enabled,created_at) VALUES('stud2','hash','stud2@unica.edu.pe','Estudiante 2','STUDENT',1,GETDATE());
INSERT INTO users(username,password,email,full_name,role,enabled,created_at) VALUES('stud3','hash','stud3@unica.edu.pe','Estudiante 3','STUDENT',1,GETDATE());
INSERT INTO users(username,password,email,full_name,role,enabled,created_at) VALUES('stud4','hash','stud4@unica.edu.pe','Estudiante 4','STUDENT',1,GETDATE());
INSERT INTO users(username,password,email,full_name,role,enabled,created_at) VALUES('stud5','hash','stud5@unica.edu.pe','Estudiante 5','STUDENT',1,GETDATE());
INSERT INTO users(username,password,email,full_name,role,enabled,created_at) VALUES('stud6','hash','stud6@unica.edu.pe','Estudiante 6','STUDENT',1,GETDATE());
INSERT INTO users(username,password,email,full_name,role,enabled,created_at) VALUES('stud7','hash','stud7@unica.edu.pe','Estudiante 7','STUDENT',1,GETDATE());
INSERT INTO users(username,password,email,full_name,role,enabled,created_at) VALUES('stud8','hash','stud8@unica.edu.pe','Estudiante 8','STUDENT',1,GETDATE());
INSERT INTO users(username,password,email,full_name,role,enabled,created_at) VALUES('stud9','hash','stud9@unica.edu.pe','Estudiante 9','STUDENT',1,GETDATE());
INSERT INTO users(username,password,email,full_name,role,enabled,created_at) VALUES('stud10','hash','stud10@unica.edu.pe','Estudiante 10','STUDENT',1,GETDATE());
INSERT INTO users(username,password,email,full_name,role,enabled,created_at) VALUES('stud11','hash','stud11@unica.edu.pe','Estudiante 11','STUDENT',1,GETDATE());
INSERT INTO users(username,password,email,full_name,role,enabled,created_at) VALUES('stud12','hash','stud12@unica.edu.pe','Estudiante 12','STUDENT',1,GETDATE());
INSERT INTO users(username,password,email,full_name,role,enabled,created_at) VALUES('stud13','hash','stud13@unica.edu.pe','Estudiante 13','STUDENT',1,GETDATE());
INSERT INTO users(username,password,email,full_name,role,enabled,created_at) VALUES('stud14','hash','stud14@unica.edu.pe','Estudiante 14','STUDENT',1,GETDATE());
INSERT INTO users(username,password,email,full_name,role,enabled,created_at) VALUES('stud15','hash','stud15@unica.edu.pe','Estudiante 15','STUDENT',1,GETDATE());
INSERT INTO users(username,password,email,full_name,role,enabled,created_at) VALUES('stud16','hash','stud16@unica.edu.pe','Estudiante 16','STUDENT',1,GETDATE());
INSERT INTO users(username,password,email,full_name,role,enabled,created_at) VALUES('stud17','hash','stud17@unica.edu.pe','Estudiante 17','STUDENT',1,GETDATE());
INSERT INTO users(username,password,email,full_name,role,enabled,created_at) VALUES('stud18','hash','stud18@unica.edu.pe','Estudiante 18','STUDENT',1,GETDATE());
INSERT INTO users(username,password,email,full_name,role,enabled,created_at) VALUES('stud19','hash','stud19@unica.edu.pe','Estudiante 19','STUDENT',1,GETDATE());
INSERT INTO users(username,password,email,full_name,role,enabled,created_at) VALUES('stud20','hash','stud20@unica.edu.pe','Estudiante 20','STUDENT',1,GETDATE());
INSERT INTO users(username,password,email,full_name,role,enabled,created_at) VALUES('stud21','hash','stud21@unica.edu.pe','Estudiante 21','STUDENT',1,GETDATE());
INSERT INTO users(username,password,email,full_name,role,enabled,created_at) VALUES('stud22','hash','stud22@unica.edu.pe','Estudiante 22','STUDENT',1,GETDATE());
INSERT INTO services(name,description,prefix,ticket_sequence,active,assigned_operator_id,created_at) VALUES
('Biblioteca','Biblioteca Central','BIB',100,1,3,GETDATE()),
('Caja','Pagos','CAJ',100,1,4,GETDATE()),
('Secretaría','Trámites','SEC',100,1,5,GETDATE()),
('Bienestar Universitario','Apoyo','BIE',100,1,6,GETDATE()),
('Mesa de Partes','Documentos','MES',100,1,7,GETDATE()),
('Laboratorio','Laboratorios','LAB',100,1,8,GETDATE());
INSERT INTO tickets(ticket_code,status,priority,queue_position,student_id,service_id,operator_id,created_at) VALUES('T0001','CREATED','NORMAL',1,9,1,NULL,GETDATE());
INSERT INTO tickets(ticket_code,status,priority,queue_position,student_id,service_id,operator_id,created_at) VALUES('T0008','CREATED','NORMAL',8,16,2,NULL,GETDATE());
INSERT INTO tickets(ticket_code,status,priority,queue_position,student_id,service_id,operator_id,created_at) VALUES('T0015','CREATED','PREFERENTE',15,23,3,NULL,GETDATE());
INSERT INTO tickets(ticket_code,status,priority,queue_position,student_id,service_id,operator_id,created_at) VALUES('T0022','CREATED','NORMAL',22,30,4,NULL,GETDATE());
INSERT INTO tickets(ticket_code,status,priority,queue_position,student_id,service_id,operator_id,created_at) VALUES('T0029','CREATED','NORMAL',29,15,5,NULL,GETDATE());
INSERT INTO tickets(ticket_code,status,priority,queue_position,student_id,service_id,operator_id,created_at) VALUES('T0036','CREATED','NORMAL',36,22,6,NULL,GETDATE());