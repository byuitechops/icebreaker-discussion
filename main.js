const canvas = require('canvas-wrapper');

module.exports = (course, stepCallback) => {

    /* NOTE: PROCESS
        1. getModule() - Retrieves the first week module
        2. getModuleItems() - Retrieves the module items for the week 01 module
        3. findIcebreaker() - Compares a list of regexs against each module item, checking for an existing icebreaker board
        4. createIcebreaker() - If one isn't available, creates a new Icebreaker discussion topic and puts a module item in week 01
    */

    function getModule() {
        return new Promise((resolve, reject) => {
            canvas.get(`/api/v1/courses/${course.info.canvasOU}/modules`, (err, canvasModules) => {
                if (err) return reject(err);
                /* Identify week 01 module */
                var week01Module = canvasModules.find(module => /((lesson)|(week))\s\d?1/i.test(module.name));
                if (canvasModules.length === 0 || !week01Module) {
                    return reject(new Error('Unable to find a Week 01 module. Unable to create/name Icebreaker discussion topic.'));
                }
                resolve(week01Module);
            });
        });
    }

    function getModuleItems(module) {
        return new Promise((resolve, reject) => {
            canvas.getModuleItems(course.info.canvasOU, module.id, (err, moduleItems) => {
                if (err) return reject(err);
                resolve(moduleItems);
            });
        });
    }

    function findIcebreaker(moduleItems) {
        var matches = [
            /ice\s?breaker/i,
            /class\sintroductions?/i
        ];
        moduleItems = moduleItems.filter(moduleItem => {
            return moduleItem.type === 'Discussion';
        });
        /* Check if any of our module items in Week 01 match any common patterns for introduction boards */
        return moduleItems.find(moduleItem => {
            return matches.some(reg => reg.test(moduleItem.title));
        });
    }

    function createIcebreaker(moduleItem) {
        return new Promise((resolve, reject) => {
            var title = 'W01 Discussion: Icebreaker';
            if (moduleItem) {
                // Rename the board
                canvas.put(`/api/v1/courses/${course.info.canvasOU}/discussion_topics/${moduleItem.content_id}`, {
                    title
                }, (err, newTopic) => {
                    if (err) return reject(err);
                    course.log('Discussion Topics Renamed', {
                        'ID': newTopic.id,
                        'Title': title
                    });
                    resolve();
                });
            } else {
                // Create the board
                canvas.post(`/api/v1/courses/${course.info.canvasOU}/discussion_topics`, {
                    title
                }, (err, newTopic) => {
                    if (err) return reject(err);
                    course.log('Discussion Topics Created', {
                        'ID': newTopic.id,
                        'Title': title
                    });
                    resolve();
                });
            }
        });
    }

    getModule()
        .then(getModuleItems)
        .then(findIcebreaker)
        .then(createIcebreaker)
        .then(() => {
            stepCallback(null, course);
        })
        .catch(e => {
            course.error(e);
            stepCallback(null, course);
        });
};