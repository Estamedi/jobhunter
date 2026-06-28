using backend.jobhunter.Application.TodoLists.Commands.CreateTodoList;
using backend.jobhunter.Application.TodoLists.Commands.DeleteTodoList;
using backend.jobhunter.Domain.Entities;

namespace backend.jobhunter.Application.FunctionalTests.TodoLists.Commands;

public class DeleteTodoListTests : TestBase
{
    [Test]
    public async Task ShouldRequireValidTodoListId()
    {
        var command = new DeleteTodoListCommand(99);
        await Should.ThrowAsync<NotFoundException>(() => TestApp.SendAsync(command));
    }

    [Test]
    public async Task ShouldDeleteTodoList()
    {
        var listId = await TestApp.SendAsync(new CreateTodoListCommand
        {
            Title = "New List"
        });

        await TestApp.SendAsync(new DeleteTodoListCommand(listId));

        var list = await TestApp.FindAsync<TodoList>(listId);

        list.ShouldBeNull();
    }
}
