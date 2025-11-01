// Queue of tasks
const taskQueue = [];

// Lock to work on one task at a time
let isProcessing = false;

/**
 * Processes the tasks in the queue.
 * This function is called internally to manage the execution of tasks.
 * It ensures that only one task is processed at a time.
 */
const processQueue = async () => {

    if (isProcessing || taskQueue.length === 0) {
        return;
    }

    // Lock the queue
    isProcessing = true;

    const task = taskQueue.shift();

    try {
        
        const result = await task.taskFunction();

        task.resolve(result);
    } catch (error) {

        task.reject(error);
    } finally {

        // Release lock and go to next task
        isProcessing = false;
        processQueue();
    }
};

/**
 * Adds a task to the queue.
 * @param {Function} taskFunction A function that returns a Promise
 * @returns {Promise<any>} A promise that resolves or rejects when the task is executed.
 */
const addToQueue = (taskFunction) => {
    return new Promise((resolve, reject) => {
        taskQueue.push({ taskFunction, resolve, reject });
        processQueue();
    });
};

export default {
    addToQueue
};