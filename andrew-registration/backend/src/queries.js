const { Pool } = require('pg');

const pool = new Pool({
    user: 'tocsorg_camyhsu',
    host: 'localhost',
    database: 'chineseschool_development',
    password: 'root',
    port: 5432,
})

const getPeopleByEmail = async (request, response) => {
    const emailAddress = request.params.email;
    
    try {
        const res = await pool.query("SELECT * FROM people FULL JOIN addresses ON people.address_id = addresses.id WHERE email LIKE '%" + emailAddress + "%'");
        response.status(200).json(res.rows);
    }
    catch (error) {
        throw error;
    }
}

const getPeopleByChineseName = async (request, response) => {
    const chineseName = request.params.chineseName;

    try {
        const res = await pool.query('SELECT english_first_name, english_last_name, chinese_name, email, gender, birth_month, birth_year, native_language \
                                        FROM people FULL JOIN addresses ON people.address_id = null \
                                        OR people.address_id = addresses.id WHERE chinese_name = $1', [chineseName]);
        response.status(200).json(res.rows);
    }
    catch (error) {
        throw error;
    }
}

const getPeopleByEnglishName = async (request, response) => {
    const firstAndLast = request.params.first_last;
    const nameArr = firstAndLast.split(/(?=[A-Z])/);

    try {
        // if only one name is given, search for the name in first and last names
        if( nameArr.length == 1 ) {
            const name = nameArr[0];
    
            const res = await pool.query("SELECT english_first_name, english_last_name, chinese_name, email, gender, birth_month, birth_year, native_language \
                                            FROM people FULL JOIN addresses ON people.address_id = null OR people.address_id = addresses.id \
                                            WHERE english_first_name LIKE '%" + name + "%' or english_last_name LIKE '%" + name + "%'");
            response.status(200).json(res.rows);
        }
        // take the first and last names in the query as the first and last name, respectively
        else {
            const firstName = nameArr[0];
            const lastName = nameArr[nameArr.length - 1];
        
            const res = await pool.query('SELECT english_first_name, english_last_name, chinese_name, email, gender, birth_month, birth_year, native_language \
                                            FROM people FULL JOIN addresses ON people.address_id = null OR people.address_id = addresses.id \
                                            WHERE english_first_name = $1 AND english_last_name = $2', [firstName, lastName]);
            response.status(200).json(res.rows);
        }

    }
    catch (error) {
        throw error;
    }
}

const getGrades = async (request, response) => {
    const emailAddress = request.params.email;
    
    try {
        const res = await pool.query('SELECT chinese_name, english_name, short_name FROM grades;');
        response.status(200).json(res.rows);
    }
    catch (error) {
        throw error;
    }
}

const getStudentCountByGrade = async (request, response) => {
    const schoolYearId = request.params.school_year_id;
    
    try {
        const res = await pool.query('SELECT chinese_name, english_name, count(grades.id), max_table.sum as max FROM grades \
                                        INNER JOIN student_class_assignments AS sca ON grades.id = sca.grade_id \
                                        INNER JOIN (SELECT grade_id, sum(max_size) FROM school_class_active_flags AS scaf \
                                        INNER JOIN school_classes ON school_classes.id = scaf.school_class_id WHERE \
                                        school_year_id = $1 AND active = \'t\' AND school_class_type != \'ELECTIVE\' \
                                        GROUP BY school_classes.grade_id ORDER BY grade_id) as max_table ON max_table.grade_id = grades.id \
                                        WHERE sca.school_year_id = $1 GROUP BY chinese_name, english_name, grades.id, max_table.sum ORDER BY grades.id;', [schoolYearId]);
        response.status(200).json(res.rows);
    }
    catch (error) {
        throw error;
    }
}

const getStudentCountByClass = async (request, response) => {
    const schoolYearId = request.params.school_year_id;
    
    try {
        const res = await pool.query('SELECT ci.english_name AS class_english_name, ci.chinese_name AS class_chinese_name, ci.count, ci.location, ci.max_size, ci.min_age, ci.max_age, \
                                            i.english_first_name AS teacher_first_name, i.english_last_name AS teacher_last_name, i.chinese_name AS teacher_chinese_name, \
                                            i.email AS teacher_email, i.home_phone AS teacher_phone, rp.english_first_name AS parent_first_name, rp.english_last_name AS parent_last_name, \
                                            rp.chinese_name AS parent_chinese_name, rp.email AS parent_email, rp.home_phone AS parent_phone \
                                        FROM school_class_active_flags as scaf \
                                        JOIN (SELECT sc.id, count(sca.school_class_id), sc.english_name, sc.chinese_name, sc.location, sc.max_size, sc.min_age, sc.max_age, sc.grade_id \
                                                FROM school_classes AS sc \
                                                JOIN student_class_assignments AS sca ON sc.id = sca.school_class_id \
                                                WHERE sca.school_year_id = $1 AND sc.school_class_type != \'ELECTIVE\' \
                                                group by sc.id, sca.school_class_id, sc.grade_id order by sc.grade_id) \
                                                AS ci ON ci.id = scaf.school_class_id \
                                        JOIN (SELECT ia.school_class_id, p.english_first_name, p.english_last_name, p.chinese_name, a.email, a.home_phone \
                                            FROM instructor_assignments AS ia \
                                            JOIN people AS p ON p.id = ia.instructor_id \
                                            JOIN families AS f ON f.parent_one_id = p.id OR f.parent_two_id = p.id \
                                            JOIN addresses AS a ON a.id = \
	  		                                    CASE \
                                                    WHEN p.address_id IS NOT null THEN p.address_id \
                                                    ELSE f.address_id \
                                                END \
                                            WHERE ia.role = \'Primary Instructor\' AND ia.school_year_id = $1) \
                                            AS i ON i.school_class_id = scaf.school_class_id \
                                        FULL JOIN (SELECT ia2.school_class_id, p2.english_first_name, p2.english_last_name, p2.chinese_name, a2.email, a2.home_phone \
                                            FROM instructor_assignments AS ia2 \
                                            JOIN people AS p2 ON p2.id = ia2.instructor_id \
                                            JOIN families AS f2 ON f2.parent_one_id = p2.id OR f2.parent_two_id = p2.id \
                                            JOIN addresses AS a2 ON a2.id = \
                                                CASE \
                                                    WHEN p2.address_id IS NOT null THEN p2.address_id \
                                                    ELSE f2.address_id \
                                                END \
                                            WHERE ia2.role = \'Room Parent\' AND ia2.school_year_id = $1) \
                                            AS rp ON rp.school_class_id = scaf.school_class_id \
                                        WHERE scaf.active = \'t\' AND scaf.school_year_id = $1 Order by ci.grade_id, ci.english_name;', [schoolYearId]);
        response.status(200).json(res.rows);
    }
    catch (error) {
        throw error;
    }
}

const verifyUserSignIn = async (request, response) => {
    const username = request.params.username;

    try {
        const res = await pool.query('SELECT person_id, password_hash, password_salt FROM users WHERE username = $1', [username]);
        response.status(200).json(res.rows);
    }
    catch (error) {
        throw error;
    }
}

const getUserData = async (request, response) => {
    const id = request.params.person_id;

    try {
        const res = await pool.query('SELECT english_first_name, english_last_name, chinese_name, gender, birth_year, birth_month, \
                                        native_language, address_id, street, city, state, zipcode, home_phone, cell_phone, email FROM people \
                                        FULL JOIN addresses ON people.address_id = null OR people.address_id = addresses.id WHERE people.id = $1', [id]);
        response.status(200).json(res.rows);
    }
    catch (error) {
        throw error;
    }
}

const getParentData = async (request, response) => {
    const id = request.params.person_id;

    try {
        const res = await pool.query('SELECT families.id as family_id, english_first_name, english_last_name, chinese_name FROM people JOIN families \
                                        ON parent_one_id = $1 or parent_two_id = $1 WHERE \
                                        (SELECT parent_one_id FROM families WHERE parent_two_id = $1) = people.id OR \
                                        (SELECT parent_two_id FROM families WHERE parent_one_id = $1) = people.id;', [id]);
        response.status(200).json(res.rows);
    }
    catch (error) {
        throw error;
    }
}

const getFamilyAddressData = async (request, response) => {
    const id = request.params.person_id;

    try {
        const res = await pool.query('SELECT id, street, city, state, zipcode, home_phone, cell_phone, email FROM addresses \
                                        WHERE addresses.id = (SELECT address_id FROM families WHERE parent_one_id = $1 or parent_two_id = $1)', [id]);
        response.status(200).json(res.rows);
    }
    catch (error) {
        throw error;
    }
}

const getStudentData = async (request, response) => {
    const id = request.params.person_id;

    try {
        const res = await pool.query('SELECT people.id, english_first_name, english_last_name, chinese_name, gender, birth_month, birth_year, native_language \
                                        FROM people WHERE people.id IN (SELECT child_id FROM families_children WHERE families_children.family_id = \
                                        (SELECT id FROM families WHERE parent_one_id = $1 OR parent_two_id = $1));', [id]);
        response.status(200).json(res.rows);
    }
    catch (error) {
        throw error;
    }
}

const patchUserData = async (request, response) => {
    const id = request.params.person_id;
    const { englishFirstName, englishLastName, chineseName, birthYear, birthMonth, gender, nativeLanguage } = request.body;

    try {
        const res = await pool.query('UPDATE people \
                                        SET english_first_name = $1, english_last_name = $2, chinese_name = $3, birth_year = $4, birth_month = $5, gender = $6, native_language = $7 \
                                        WHERE id = $8', [englishFirstName, englishLastName, chineseName, birthYear, birthMonth, gender, nativeLanguage, id]);
        response.status(200).json(res.rows);
    }
    catch (error) {
        throw error;
    }
}

const patchAddress = async (request, response) => {
    const id = request.params.address_id;
    const { street, city, state, zipcode, homePhone, cellPhone, email } = request.body;

    try {
        const res = await pool.query('UPDATE addresses \
                                        SET street = $1, city = $2, state = $3, zipcode = $4, home_phone = $5, cell_phone = $6, email = $7 \
                                        WHERE id = $8', [street, city, state, zipcode, homePhone, cellPhone, email, id]);
        response.status(200).json(res.rows);
    }
    catch (error) {
        throw error;
    }
}

const changePassword = async (request, response) => {
    const username = request.params.username;
    const { password_hash, password_salt } = request.body;

    try {
        const res = await pool.query('UPDATE users SET password_hash = $1, password_salt = $2 WHERE username = $3',[password_hash, password_salt, username]);
        response.status(200).json(res.rows);
    }
    catch (error) {
        throw error;
    }
}

const addPerson = async (request, response) => {
    const { englishFirstName, englishLastName, chineseName, birthYear, birthMonth, gender, nativeLanguage } = request.body;

    try {
        const res = await pool.query('INSERT INTO people (english_last_name, english_first_name, chinese_name, gender, birth_year, birth_month, native_language) \
                                        VALUES ($1, $2, $3, $4, $5, $6, $7);', [englishLastName, englishFirstName, chineseName, gender, birthYear, birthMonth, nativeLanguage]);
        response.status(200).json(res.rows);
    }
    catch (error) {
        throw error;
    }
}

const addChild = async (request, response) => {
    const id = request.params.family_id;
    const { englishFirstName, englishLastName, chineseName, birthYear, birthMonth, gender, nativeLanguage } = request.body;
    
    try {
        const res = await pool.query('INSERT INTO families_children (family_id, child_id) VALUES ($1, \
                                        (SELECT id FROM people WHERE english_last_name = $2 and english_first_name = $3 and chinese_name = $4 and \
                                        gender = $5 and birth_year = $6 and birth_month = $7 and native_language = $8));'
                                        , [id, englishLastName, englishFirstName, chineseName, gender, birthYear, birthMonth, nativeLanguage]);
        response.status(200).json(res.rows);
    }
    catch (error) {
        throw error;
    }
}

module.exports = {
    getPeopleByEmail,
    getPeopleByChineseName,
    getPeopleByEnglishName,
    getGrades,
    getStudentCountByGrade,
    getStudentCountByClass,
    verifyUserSignIn,
    getUserData,
    getParentData,
    getFamilyAddressData,
    getStudentData,
    patchUserData,
    patchAddress,
    changePassword,
    addPerson,
    addChild,
}
