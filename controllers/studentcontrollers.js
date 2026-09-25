const students = [
    { id: 1, name: 'John', age: 20 },
    { id: 2, name: 'Jane', age: 22 }
];

const getStudents = (req, res) => {
    res.json(students);
};

const getStudentById = (req, res) => {
    const id = Number(req.params.id);

    const student = students.find(student => student.id === id);

    if (student) {
        res.json(student);
    } else {
        res.status(404).json({
            message: 'Student not found'
        });
    }
};

const createStudent = (req, res) => {
    const { name, age } = req.body;

    const student = {
        id: students.length + 1,
        name: name,
        age: age
    };

    students.push(student);

    res.status(201).json(student);
};

const updateStudent = (req, res) => {
    const id = Number(req.params.id);
    const { name, age } = req.body;

    const student = students.find(student => student.id === id);

    if (student) {
        if (name !== undefined) {
            student.name = name;
        }

        if (age !== undefined) {
            student.age = age;
        }

        res.json(student);
    } else {
        res.status(404).json({
            message: 'Student not found'
        });
    }
};

const deleteStudent = (req, res) => {
    const id = Number(req.params.id);

    const index = students.findIndex(student => student.id === id);

    if (index !== -1) {
        const deletedStudent = students.splice(index, 1);

        res.json(deletedStudent[0]);
    } else {
        res.status(404).json({
            message: 'Student not found'
        });
    }
};

module.exports = {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent
};