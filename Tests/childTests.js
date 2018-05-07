/* Dependencies */
const tap = require('tap');
const canvas = require('canvas-wrapper');

module.exports = (course, callback) => {
    tap.test('child-template', (test) => {

        // Get the Discussion Topic
        canvas.get(`/api/v1/courses/${course.info.canvasOU}/discussion_topics?search_term=W01 Discussion: Icebreaker`, (err, topics) => {
            if (err) {
                course.error(err);
                test.end();
                return;
            }

            var icebreaker = topics.find(topic => topic.title === 'W01 Discussion: Icebreaker');

            test.ok(icebreaker, 'W01 Discussion: Icebreaker - Doesn\'t exist in the course.');
            test.equal(icebreaker.title, 'W01 Discussion: Icebreaker');
            test.end();
        });
    });

    // Always call the callback in your childTests with just null
    callback(null);
};