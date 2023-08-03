using UnityEngine;
using System.Collections.Generic;
using System.Reflection;
using System.Collections;

public class ScratchLib : MonoBehaviour
{
    SpriteRenderer spriteRenderer;

    private static List<ScratchLib> spriteScriptInstances = new List<ScratchLib>();
    private void Awake()
    {
        spriteRenderer = GetComponent<SpriteRenderer>();
        spriteScriptInstances.Add(this);
    }

    public static List<ScratchLib> GetAllInstances()
    {
        return spriteScriptInstances;
    }

    protected virtual void OnDestroy()
    {
        // Remove the instance from the list when it's destroyed
        spriteScriptInstances.Remove(this);
    }

    #region Motions

    public void GoToXY(float x, float y)
    {
        transform.position = new Vector2(x, y);
    }
    public void GoTo(string type, string name = "")
    {
        switch (type)
        {
            case "mouse":
                transform.position = GetMousePosition();
                break;
            case "random":
                transform.position = new Vector2(UnityEngine.Random.Range(-240, 240), UnityEngine.Random.Range(-180, 180));
                break;
            case "sprite":
                Transform sprite = GameObject.Find(name).transform;
                transform.position = sprite.position;
                break;
            default:
                break;
        }
    }
    public void PointTowards(string type, string name = "")
    {
        switch (type)
        {
            case "mouse":
                transform.rotation = LookAt2D(transform.position, GetMousePosition());
                break;
            case "sprite":
                Transform sprite = GameObject.Find(name).transform;
                transform.rotation = LookAt2D(transform.position, sprite.position);
                break;
            default:
                break;
        }
    }

    Quaternion LookAt2D(Vector3 position, Vector3 targetPosition)
    {
        Vector3 directionToTarget = targetPosition - position;
        float angle = Mathf.Atan2(directionToTarget.y, directionToTarget.x) * Mathf.Rad2Deg;
        return Quaternion.AngleAxis(angle, Vector3.forward);
    }
    public void ChangeX(float x)
    {
        transform.Translate(Vector2.right * x);
    }
    public void ChangeY(float y)
    {
        transform.Translate(Vector2.up * y);
    }
    public void MoveSteps(float steps)
    {
        transform.Translate(Vector2.right * steps, Space.Self);
    }
    public void TurnRight(float degrees)
    {
        transform.Rotate(Vector3.forward, degrees);
    }
    public void TurnLeft(float degrees)
    {
        transform.Rotate(Vector3.forward, -degrees);
    }
    public void SetRotation(float degrees)
    {
        transform.rotation = Quaternion.Euler(Vector3.forward * (degrees - 90));
    }
    public void SetX(float x)
    {
        transform.position = new Vector2(x, transform.position.y);
    }
    public void SetY(float y)
    {
        transform.position = new Vector2(transform.position.x, y);
    }

    #endregion

    #region Looks
    public void Hide()
    {
        GetComponent<SpriteRenderer>().enabled = false;
    }
    public void Show()
    {
        GetComponent<SpriteRenderer>().enabled = true;
    }
    public void SetSize(float size)
    {
        transform.localScale = Vector3.one * size;
    }
    public void ChangeSize(float size)
    {
        transform.localScale = transform.localScale - Vector3.one * size;
    }
    public void SetLayer(string layer)
    {
        spriteRenderer.sortingLayerName = layer;
    }
    public void ChangeLayer(string direction, int layer)
    {
        if (direction == "backward")
        {
            layer = -layer;
        }
        spriteRenderer.sortingOrder += layer;
    }
    #endregion

    #region Sensing
    public float GetMousePositionX()
    {
        return GetMousePosition().x;
    }
    public float GetMousePositionY()
    {
        return GetMousePosition().y;
    }

    Vector2 GetMousePosition()
    {
        return Camera.main.ScreenToWorldPoint(new Vector3(Input.mousePosition.x, Input.mousePosition.y, 0));
    }

    public float getDistanceTo(string type, string name = "")
    {
        switch (type)
        {
            case "mouse":
                return Vector2.Distance(transform.position, GetMousePosition());
            case "sprite":
                Transform sprite = GameObject.Find(name).transform;
                return Vector2.Distance(transform.position, sprite.position);
            default:
                return 0;
        }
    }
    #endregion

    #region Operators
    public string LetterOf(int letter, string input)
    {
        return input[letter - 1].ToString();
    }
    #endregion

    #region Messages
    public IEnumerator SendMessageToAll(string message, bool wait = false)
    {
        foreach (var sprite in spriteScriptInstances)
        {
            if (CoroutineChecker.ContainsCoroutine(sprite, message))
            {
                if (wait)
                {
                    yield return sprite.StartCoroutine(message);
                }
                else
                {
                    sprite.StartCoroutine(message);
                }

            }
        }
        yield return null;

    }
    #endregion
}

public static class CoroutineChecker
{
    public static bool ContainsCoroutine(MonoBehaviour script, string coroutineName)
    {
        foreach (MethodInfo method in script.GetType().GetMethods(BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public))
        {
            if (method.ReturnType == typeof(IEnumerator) && method.Name == coroutineName)
            {
                return true;
            }
        }
        return false;
    }
}